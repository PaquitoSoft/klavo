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
// const CACHE_MOVIES_TTL = 60 /* minutes */ * 24 /* hours */ * 30 /* days */; // One month (in minutes)
const CACHE_MOVIES_TTL = 10;
const CACHE_MOVIE_DETAIL_TTL = 60 * 24 * 1;

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
					movies = [...moviesDocument.querySelectorAll('.showpeliculas .postsh')].map(movieEl => {
						return new MovieModel(movieEl, 'htmlSumamryElement');
					});
				} else {
					let raw = [...moviesDocument.querySelectorAll('.showpeliculas .postsh')].slice(0, 10);
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
				lscache.set(cacheKey, movies, CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
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

function getMoviesDetails(url, moviesLinksSelector, cacheKey) {
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
			.then(movies => {
				lscache.set(cacheKey, movies, CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
				return movies;
			})
			.then(resolve)
			.catch(reject);
	});
}

function getNewSectionMovies(moviesSectionLoader, cacheKey) {
	return new Promise((resolve, reject) => {
		let cachedPremiers = lscache.get(cacheKey) || [];
		
		moviesSectionLoader()
			.then(movies => {
				resolve(movies.filter((movie) => {
					return cachedPremiers.findIndex(listItem => { return listItem.cpId === movie.cpId; }) === -1;
				}));
			})
			.catch(reject);
	});
}

function updateSectionMovies(moviesSectionLoader, cacheKey) {
	console.debug('MoviesCatalogApi::updateSectionMovies# Updating movies...');
	getNewSectionMovies(moviesSectionLoader, cacheKey)
		.then(newMovies => {
			if (newMovies.length) {
				let cachedPremiers = lscache.get(cacheKey) || [];
				console.debug('MoviesCatalogApi::updateSectionMovies# Updating movies with...', newMovies.length, cachedPremiers.length);
				lscache.set(cacheKey, newMovies.concat(cachedPremiers), CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
				eventsManager.trigger(constants.events.NEW_MOVIES_AVAILABLE, newMovies);
			} else {
				console.debug('MoviesCatalogApi::updateSectionMovies# There are no new movies.');
			}
		})
		.catch(error => {
			console.error('MoviesCatalogApi::updateSectionMovies# Error updating movies:', error);
			console.error(error.stack);
		});
}

/* --------------------------------------------------------------- */

export function getPremiers() {
	const moviesSelector = '.showpeliculas .postsh',
		cachedPremiers = lscache.get(CACHE_PREMIERS_KEY);

	if (cachedPremiers) {
		console.debug('MoviesCatalogApi::getPremiers# Returning cached premiers...');

		// TODO Try to update premiers list if it has passed a long time since the last time we did it
		setTimeout(function() {
			let moviesLoader = getMoviesSummary.bind(null, PREMIERS_MOVIES_URL, moviesSelector, CACHE_PREMIERS_KEY);
			updateSectionMovies(moviesLoader, CACHE_PREMIERS_KEY);
		}, 4);
		
		return Promise.resolve(cachedPremiers);

	} else {
		return new Promise((resolve, reject) => {
			getMoviesSummary(PREMIERS_MOVIES_URL, moviesSelector, CACHE_PREMIERS_KEY)
				.then(resolve)
				.catch(reject);
		});
	}
}


export function getRecentlyAdded() {
	const moviesSelector = '.showpeliculas .posthome .postsh',
		cachedMovies = lscache.get(CACHE_RECENTLY_ADDED_KEY);

	if (cachedMovies) {
		console.debug('MoviesCatalogApi::getRecentlyAdded# Returning cached movies...');

		// TODO Try to update premiers list if it has passed a long time since the last time we did it
		setTimeout(function() {
			let moviesLoader = getMoviesSummary.bind(null, RECENTLY_ADDED_MOVIES_URL, moviesSelector, CACHE_RECENTLY_ADDED_KEY);
			updateSectionMovies(moviesLoader, CACHE_RECENTLY_ADDED_KEY);	
		}, 4);
		
		return Promise.resolve(cachedMovies);

	} else {
		return new Promise((resolve, reject) => {
			getMoviesSummary(RECENTLY_ADDED_MOVIES_URL, moviesSelector, CACHE_RECENTLY_ADDED_KEY)
				.then(resolve)
				.catch(reject);
		});
	}
}


export function getMostViewed() {
	let cachedMovies = lscache.get(CACHE_MOST_VIEWED_KEY);

	if (cachedMovies) {
		console.debug('MoviesCatalogApi::getMostViewed# Returning cached movies...');
		// TODO Update in the background
		return Promise.resolve(cachedMovies);
	} else {
		return getMoviesDetails(MOST_VIEWED_MOVIES_URL, '.showpeliculas > .loph3 a', CACHE_MOST_VIEWED_KEY);
	}
}

export function getBestRated() {
	let cachedMovies = lscache.get(CACHE_BEST_RATED_KEY);

	if (cachedMovies) {
		// TODO Update in the background
		return Promise.resolve(cachedMovies);
	} else {
		return getMoviesDetails(BEST_RATED_MOVIES_URL, '#rating10 .topli10 a', CACHE_BEST_RATED_KEY);
	}
}
