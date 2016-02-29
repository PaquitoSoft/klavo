import lscache from 'lscache';
import { getHtml } from '../plugins/ajax';
import eventsManager from '../plugins/events-manager';
import constants from '../plugins/constants';
import MovieModel from '../models/movie';

const CORS_SERVICE_BASE_URL = 'https://crossorigin.me/';
const MOVIES_SERVICE_BASE_URL = 'http://www.clubpelis.com/';
const PREMIERS_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}genero/estrenos`;
const MOST_VIEWED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}genero/estrenos`;
const BEST_RATED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}genero/estrenos`;
const RECENTLY_ADDED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`;

const CACHE_LASTUPDATES = 'movies-lastupdates';
const CACHE_PREMIERS_KEY = 'movies-premiers';
const CACHE_RECENTLY_ADDED_KEY = 'movies-recently-added';
// const CACHE_MOVIES_TTL = 60 /* minutes */ * 24 /* hours */ * 7 /* days */; // One week (in minutes)
const CACHE_MOVIES_TTL = 1;

function getMoviesSummary(url, moviesSelector, cacheKey) {
	return new Promise((resolve, reject) => {
		console.time('Load movies');
		getHtml(url)
			.then(premiersDocument => {
				console.timeEnd('Load movies');

				/* START Debug */
				let movies;
				let cachedPremiers = lscache.get(cacheKey) || [];

				if (cachedPremiers.length) {
					movies = [...premiersDocument.querySelectorAll('.showpeliculas .postsh')].map(movieEl => {
						return new MovieModel(movieEl, 'htmlElement');
					});
				} else {
					let raw = [...premiersDocument.querySelectorAll('.showpeliculas .postsh')].slice(0, 10);
					movies = raw.map(movieEl => {
						return new MovieModel(movieEl, 'htmlElement');
					});
				}
				/* END  Debug */


				// console.time('Parse movies');
				// let movies = [...premiersDocument.querySelectorAll(moviesSelector)].map(movieEl => {
				// 	return new MovieModel(movieEl, 'htmlElement');
				// });
				// console.timeEnd('Parse movies');
				lscache.set(cacheKey, movies, CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
				resolve(movies);
			})
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
		console.debug('MoviesCatalogApi::getRecentlyAdded# Returning cached premiers...');

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


export function getMostViewed() {}

export function getBestRated() {}
