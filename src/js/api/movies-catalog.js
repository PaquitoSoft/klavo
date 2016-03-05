import lscache from 'lscache';
import { getHtml } from '../plugins/ajax';
import eventsManager from '../plugins/events-manager';
import constants from '../config/constants';
import MovieModel from '../models/movie';

// const CORS_SERVICE_BASE_URL = 'https://crossorigin.me/';
const CORS_SERVICE_BASE_URL = 'http://cors.io/?u=';
const MOVIES_SERVICE_BASE_URL = 'http://www.clubpelis.com/';
const MOVIE_DETAILS_BASE_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}?p=`;

const CACHE_LASTUPDATES = 'movies-lastupdates';
const CACHE_MOVIE_DETAIL_KEY = 'movie-detail-';
const CACHE_MOVIES_TTL = 60 /* minutes */ * 24 /* hours */ * 30 /* days */; // One month (minutes)
// const CACHE_MOVIES_TTL = 10;
const CACHE_MOVIE_DETAIL_TTL = 60 * 24 * 1; // One day (minutes)

const UPDATE_CACHED_MOVIES_INTERVAL = 1 * 24 * 60 * 60 * 1000; // One day (milliseconds)
// const UPDATE_CACHED_MOVIES_INTERVAL = 10 * 1000;


function cacheMovies(cacheKey, movies) {
	lscache.set(cacheKey, movies, CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
	return movies;
}

function filterNewMovies(cachedMovies, newMovies) {
	return newMovies.filter((movie) => {
		return cachedMovies.findIndex(listItem => { return listItem.cpId === movie.cpId; }) === -1;
	});
}

function getMoviesSummary(url, moviesSelector, cacheKey) {
	return new Promise((resolve, reject) => {
		console.time('Load movies summaries');
		getHtml(url)
			.then(moviesDocument => {
				console.timeEnd('Load movies summaries');

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
			getHtml(`${MOVIE_DETAILS_BASE_URL}${movieCpId}`)
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
		console.time('Load movies details');
		getHtml(url)
			.then(moviesDocument => {
				let moviesIdentifiers = [...moviesDocument.querySelectorAll(moviesLinksSelector)].map(movieLink => {
					return movieLink.getAttribute('href').match(/pelicula\/(\d*)\//)[1];
				});
				return moviesIdentifiers;
			})
			.then(getMoviesByIds)
			.then(movies => {
				console.timeEnd('Load movies details');
				// Filter errored movies requests
				return movies.filter(movie => { return movie !== null });
			})
			.then(resolve)
			.catch(reject);
	});
}

function updateMovies(moviesLoader, url, elementsSelector, cacheKey) {
	/*
		1. Get current movies
		2. Filter out the ones which we already have
		3. Update cached movies with the new ones (if there are any)
		4. Notify new movies (if there are any)
	*/
	return new Promise(resolve => {
		let cachedMovies = lscache.get(cacheKey) || [];

		moviesLoader(url, elementsSelector, cacheKey)
			.then(movies => {
				return filterNewMovies(cachedMovies, movies);
			})
			.then(newMovies => {
				if (newMovies.length) {
					lscache.set(cacheKey, newMovies.concat(cachedMovies), CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
					eventsManager.trigger(constants.events.NEW_MOVIES_AVAILABLE, newMovies);
				} else {
					console.debug('MoviesCatalogApi::updateMovies# There are no new movies.');
				}
				resolve(newMovies);
			})
			.catch(err => {
				console.error('MoviesCatalogApi::updateMovies# Error updating movies:', err);
				console.error(err.stack);
			});
	});
}

function getSectionMovies(section, moviesLoader, url, elementsSelector, cacheKey) {
	const cachedPremiers = lscache.get(cacheKey),
		lastUpdates = lscache.get(CACHE_LASTUPDATES) || {};

	if (cachedPremiers) {
		console.debug('MoviesCatalogApi::getSectionMovies# Returning cached movies...');
	
		setTimeout(function() {
			// Only update movies after one day has passed since the last time we did it
			if (!lastUpdates[section] || (Date.now() - lastUpdates[section]) > UPDATE_CACHED_MOVIES_INTERVAL) {
				console.debug(`Let\'s update ${section}...`);
				updateMovies(moviesLoader, url, elementsSelector, cacheKey)
					.then(() => {
						lastUpdates[section] = Date.now();
						lscache.set(CACHE_LASTUPDATES, lastUpdates);
					});
			}
		}, 200);
		
		return Promise.resolve(cachedPremiers);

	} else {
		return moviesLoader(url, elementsSelector, cacheKey)
			.then(movies => {
				lastUpdates[section] = Date.now();
				lscache.set(CACHE_LASTUPDATES, lastUpdates);
				return movies;
			})
			.then(cacheMovies.bind(null, cacheKey));
	}
}

/* ----------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------- */

// const PREMIERS_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}genero/estrenos`;
// const MOST_VIEWED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`;
// const BEST_RATED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}?p=2490`;
// const RECENTLY_ADDED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`;

export function getPremiers() {
	return getSectionMovies(
		constants.sections.premiers,
		getMoviesSummary,
		`${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}genero/estrenos`,
		'.showpeliculas .postsh',
		constants.cache.CACHE_PREMIERS_KEY
	);	
}


export function getRecentlyAdded() {
	return getSectionMovies(
		constants.sections['recently-added'],
		getMoviesSummary,
		`${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`,
		'.showpeliculas .posthome .postsh',
		constants.cache.CACHE_RECENTLY_ADDED_KEY		
	);
}

export function getMostViewed() {
	return getSectionMovies(
		constants.sections['most-viewed'],
		getMoviesDetails,
		`${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`,
		'.showpeliculas > .loph3 a',
		constants.cache.CACHE_MOST_VIEWED_KEY		
	);
}

export function getBestRated() {
	return getSectionMovies(
		constants.sections['best-rated'],
		getMoviesDetails,
		`${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}?p=2490`,
		'#rating10 .topli10 a',
		constants.cache.CACHE_BEST_RATED_KEY
	);
}

export function getMovie(cpId) {
	return getMovieDetails(cpId);
}
