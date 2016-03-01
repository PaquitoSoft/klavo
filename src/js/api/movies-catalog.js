import lscache from 'lscache';
import { getHtml } from '../plugins/ajax';
import eventsManager from '../plugins/events-manager';
import constants from '../plugins/constants';
import MovieModel from '../models/movie';

const CORS_SERVICE_BASE_URL = 'https://crossorigin.me/';
const MOVIES_SERVICE_BASE_URL = 'http://www.clubpelis.com/';
const PREMIERS_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}genero/estrenos`;
const MOST_VIEWED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`;
const BEST_RATED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}?p=2490`;
const RECENTLY_ADDED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`;
const MOVIE_DETAILS_BAE_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}?p=`;

const CACHE_LASTUPDATES = 'movies-lastupdates';
const CACHE_PREMIERS_KEY = 'movies-premiers';
const CACHE_RECENTLY_ADDED_KEY = 'movies-recently-added';
const CACHE_MOST_VIEWED_KEY = 'movies-most-viewed';
const CACHE_BEST_RATED_KEY = 'movies-best-rated';
const CACHE_MOVIE_DETAIL_KEY = 'movie-detail-';
const CACHE_MOVIES_TTL = 60 /* minutes */ * 24 /* hours */ * 30 /* days */; // One month (minutes)
// const CACHE_MOVIES_TTL = 10;
const CACHE_MOVIE_DETAIL_TTL = 60 * 24 * 1; // One day (minutes)

// const UPDATE_CACHED_MOVIES_INTERVAL = 1 * 24 * 60 * 60 * 1000; // One day (milliseconds)
const UPDATE_CACHED_MOVIES_INTERVAL = 10 * 1000;

function getMoviesSummary(url, moviesSelector, cacheKey) {
	return new Promise((resolve, reject) => {
		console.time('Load movies');
		getHtml(url)
			.then(moviesDocument => {
				console.timeEnd('Load movies');

				/* START Debug 
				let movies;
				let cachedPremiers = lscache.get(cacheKey) || [];

				if (cachedPremiers.length) {
					movies = [...moviesDocument.querySelectorAll(moviesSelector)].map(movieEl => {
						return new MovieModel(movieEl, 'htmlSummaryElement');
					});
				} else {
					let raw = [...moviesDocument.querySelectorAll(moviesSelector)].slice(0, 10);
					movies = raw.map(movieEl => {
						return new MovieModel(movieEl, 'htmlSummaryElement');
					});
				}
				/* END  Debug */


				console.time('Parse movies');
				let movies = [...moviesDocument.querySelectorAll(moviesSelector)].map(movieEl => {
					return new MovieModel(movieEl, 'htmlSummaryElement');
				});
				console.timeEnd('Parse movies');
				resolve(movies);
			})
			.catch(reject);
	});
}

function getMovieDetails(movieCpId) {
	let movieCacheKey = `${CACHE_MOVIE_DETAIL_KEY}${movieCpId}`,
		cachedMovie = lscache.get(movieCacheKey);

	if (cachedMovie) {
		return Promise.resolve(cachedMovie);
	} else {
		return new Promise((resolve, reject) => {
			console.time('Load movie detail');
			getHtml(`${MOVIE_DETAILS_BAE_URL}${movieCpId}`)
				.then(movieDocument => {
					console.timeEnd('Load movie detail');

					// Sometime I get an empty body response
					let documentBody = movieDocument.querySelector('body');
					if (!documentBody.querySelector('#informacion')) {
						console.warn('There was a problem requeting movie', movieCpId);
						resolve(null);
					} else {
						console.time('Parse movie detail');
						let movie = new MovieModel(documentBody, 'htmlDetailElement', movieCpId);
						console.timeEnd('Parse movie detail');
						lscache.set(movieCacheKey, movie, CACHE_MOVIE_DETAIL_TTL);
						resolve(movie);
					}
				})
				.catch(reject);
		});
	}	
}

function getMoviesByIds(identifiers) {
	return Promise.all(identifiers.map(cpId => {
		return getMovieDetails(cpId);
	}));
}

function getMoviesDetails(url, moviesLinksSelector) {
	// TODO An error getting one movie must not discard the rest
	return new Promise((resolve, reject) => {
		getHtml(url)
			.then(moviesDocument => {
				let moviesIdentifiers = [...moviesDocument.querySelectorAll(moviesLinksSelector)].map(movieLink => {
					return movieLink.getAttribute('href').match(/pelicula\/(\d*)\//)[1];
				});
				return moviesIdentifiers;
			})
			.then(getMoviesByIds)
			.then(movies => {
				// Filter errored movies requests
				return movies.filter(movie => { return movie !== null });
			})
			.then(resolve)
			.catch(reject);
	});
}

function updateMoviesDetails(url, moviesLinksSelector, cacheKey) {
	/*
		1. Get current most viewed
		2. Filter out the ones which we already have
		3. Update cached movies with the new ones (if there are any)
		4. Notify new movies (if there are any)
	*/
	return new Promise(resolve => {
		let cachedMovies = lscache.get(cacheKey) || [];

		getMoviesDetails(url, moviesLinksSelector)
			.then(movies => {
				return filterNewMovies(cachedMovies, movies);
			})
			.then(newMovies => {
				if (newMovies.length) {
					lscache.set(cacheKey, newMovies.concat(cachedMovies), CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
					eventsManager.trigger(constants.events.NEW_MOVIES_AVAILABLE, newMovies);
				} else {
					console.debug('MoviesCatalogApi::updateMoviesDetails# There are no new movies.');
				}
				resolve(newMovies);
			})
			.catch(err => {
				console.error('MoviesCatalogApi::updateMoviesDetails# Error updating movies:', err);
				console.error(err.stack);
			});
	});
}

function getNewSectionMovies(moviesUrl, moviesSelector, cacheKey) {
	return new Promise((resolve, reject) => {
		let cachedMovies = lscache.get(cacheKey) || [];
		
		getMoviesSummary(moviesUrl, moviesSelector, cacheKey)
			.then(movies => {
				resolve(movies.filter((movie) => {
					return cachedMovies.findIndex(listItem => { return listItem.cpId === movie.cpId; }) === -1;
				}));
			})
			.catch(reject);
	});
}

function updateSectionMovies(moviesUrl, moviesSelector, cacheKey) {
	console.debug('MoviesCatalogApi::updateSectionMovies# Updating movies...');
	return new Promise((resolve) => {
		getNewSectionMovies(moviesUrl, moviesSelector, cacheKey)
			.then(newMovies => {
				if (newMovies.length) {
					let cachedMovies = lscache.get(cacheKey) || [];
					console.debug('MoviesCatalogApi::updateSectionMovies# Updating movies with...', newMovies.length, cachedMovies.length);
					lscache.set(cacheKey, newMovies.concat(cachedMovies), CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
					eventsManager.trigger(constants.events.NEW_MOVIES_AVAILABLE, newMovies);
				} else {
					console.debug('MoviesCatalogApi::updateSectionMovies# There are no new movies.');
				}
				resolve(newMovies);
			})
			.catch(error => {
				console.error('MoviesCatalogApi::updateSectionMovies# Error updating movies:', error);
				console.error(error.stack);
			});
	});
}

function cacheMovies(cacheKey, movies) {
	lscache.set(cacheKey, movies, CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
	return movies;
}

function filterNewMovies(cachedMovies, newMovies) {
	return newMovies.filter((movie) => {
		return cachedMovies.findIndex(listItem => { return listItem.cpId === movie.cpId; }) === -1;
	});
}

/* ----------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------- */

export function getPremiers() {
	const moviesSelector = '.showpeliculas .postsh',
		cachedPremiers = lscache.get(CACHE_PREMIERS_KEY),
		lastUpdates = lscache.get(CACHE_LASTUPDATES) || {};

	if (cachedPremiers) {
		console.debug('MoviesCatalogApi::getPremiers# Returning cached premiers...');
	
		setTimeout(function() {
			// Only update movies after one day has passed since the last time we did it
			if (!lastUpdates.premiers || (Date.now() - lastUpdates.premiers) > UPDATE_CACHED_MOVIES_INTERVAL) {
				console.debug('Let\'s update premiers...');
				updateSectionMovies(PREMIERS_MOVIES_URL, moviesSelector, CACHE_PREMIERS_KEY)
					.then(() => {
						lastUpdates.premiers = Date.now();
						lscache.set(CACHE_LASTUPDATES, lastUpdates);
					});
			}
		}, 200);
		
		return Promise.resolve(cachedPremiers);

	} else {
		return new Promise((resolve, reject) => {
			getMoviesSummary(PREMIERS_MOVIES_URL, moviesSelector, CACHE_PREMIERS_KEY)
				.then(cacheMovies.bind(null, CACHE_PREMIERS_KEY))
				.then(resolve)
				.catch(reject);
		});
	}
}


export function getRecentlyAdded() {
	const moviesSelector = '.showpeliculas .posthome .postsh',
		cachedMovies = lscache.get(CACHE_RECENTLY_ADDED_KEY),
		lastUpdates = lscache.get(CACHE_LASTUPDATES) || {};

	if (cachedMovies) {
		console.debug('MoviesCatalogApi::getRecentlyAdded# Returning cached movies...');

		setTimeout(function() {
			// Only update movies after one day has passed since the last time we did it
			if (!lastUpdates.recentlyAdded || (Date.now() - lastUpdates.recentlyAdded) > UPDATE_CACHED_MOVIES_INTERVAL) {
				updateSectionMovies(RECENTLY_ADDED_MOVIES_URL, moviesSelector, CACHE_RECENTLY_ADDED_KEY)
					.then(() => {
						lastUpdates.recentlyAdded = Date.now();
						lscache.set(CACHE_LASTUPDATES, lastUpdates);
					});
			}			
		}, 200);
		
		return Promise.resolve(cachedMovies);

	} else {
		return new Promise((resolve, reject) => {
			getMoviesSummary(RECENTLY_ADDED_MOVIES_URL, moviesSelector, CACHE_RECENTLY_ADDED_KEY)
				.then(cacheMovies.bind(null, CACHE_RECENTLY_ADDED_KEY))
				.then(resolve)
				.catch(reject);
		});
	}
}

/* ........................................................................................... */

export function getMostViewed() {
	let moviesLinksSelector = '.showpeliculas > .loph3 a',
		cachedMovies = lscache.get(CACHE_MOST_VIEWED_KEY),
		lastUpdates = lscache.get(CACHE_LASTUPDATES) || {};

	if (cachedMovies) {
		setTimeout(function() {
			// Only update movies after one day has passed since the last time we did it
			if (!lastUpdates.mostViewed || (Date.now() - lastUpdates.mostViewed) > UPDATE_CACHED_MOVIES_INTERVAL) {
				console.debug('MoviesCatalogApi::getMostViewed# Updating movies...');
				updateMoviesDetails(MOST_VIEWED_MOVIES_URL, moviesLinksSelector, CACHE_MOST_VIEWED_KEY)
					.then(() => {
						lastUpdates.mostViewed = Date.now();
						lscache.set(CACHE_LASTUPDATES, lastUpdates);
					});
			}
		}, 200);

		return Promise.resolve(cachedMovies);
	} else {
		return getMoviesDetails(MOST_VIEWED_MOVIES_URL, moviesLinksSelector)
			.then(cacheMovies.bind(null, CACHE_MOST_VIEWED_KEY));
	}
}

export function getBestRated() {
	let moviesLinksSelector = '#rating10 .topli10 a',
		cachedMovies = lscache.get(CACHE_BEST_RATED_KEY),
		lastUpdates = lscache.get(CACHE_LASTUPDATES) || {};

	if (cachedMovies) {
		setTimeout(function() {
			// Only update movies after one day has passed since the last time we did it
			if (!lastUpdates.bestRated || (Date.now() - lastUpdates.bestRated) > UPDATE_CACHED_MOVIES_INTERVAL) {
				console.debug('MoviesCatalogApi::getBestRated# Updating movies...');
				updateMoviesDetails(BEST_RATED_MOVIES_URL, moviesLinksSelector, CACHE_BEST_RATED_KEY)
					.then(() => {
						lastUpdates.bestRated = Date.now();
						lscache.set(CACHE_LASTUPDATES, lastUpdates);
					});
			}
		}, 200);

		return Promise.resolve(cachedMovies);
	} else {
		return getMoviesDetails(BEST_RATED_MOVIES_URL, '#rating10 .topli10 a')
			.then(cacheMovies.bind(null, CACHE_BEST_RATED_KEY));
	}
}
