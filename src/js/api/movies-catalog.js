import lscache from 'lscache';
import { getHtml } from '../plugins/ajax';
import eventsManager from '../plugins/events-manager';
import constants from '../plugins/constants';
import MovieModel from '../models/movie';

const CORS_SERVICE_BASE_URL = 'https://crossorigin.me/';
const MOVIES_SERVICE_BASE_URL = 'http://www.clubpelis.com/';
const PREMIERS_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}genero/estrenos`;
const MOST_VIEWED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`;
const BEST_RATED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}genero/estrenos`;
const RECENTLY_ADDED_MOVIES_URL = `${CORS_SERVICE_BASE_URL}${MOVIES_SERVICE_BASE_URL}`;
const MOVIE_DETAILS_BAE_URL = 'http://www.clubpelis.com/?p=';

const CACHE_LASTUPDATES = 'movies-lastupdates';
const CACHE_PREMIERS_KEY = 'movies-premiers';
const CACHE_RECENTLY_ADDED_KEY = 'movies-recently-added';
const CACHE_MOST_VIEWED_KEY = 'movies-most-viewed';
const CACHE_MOVIE_DETAIL_KEY = 'movie-detail-';
// const CACHE_MOVIES_TTL = 60 /* minutes */ * 24 /* hours */ * 7 /* days */; // One week (in minutes)
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

function getMovieDetails(movieCbId) {
	let movieCacheKey = `${CACHE_MOVIE_DETAIL_KEY}${movieCbId}`,
		cachedMovie = lscache.get(movieCacheKey);

	if (cachedMovie) {
		return Promise.resolve(cachedMovie);
	} else {
		return new Promise((resolve, reject) => {
			console.time('Load movie detail');
			getHtml(`${MOVIE_DETAILS_BAE_URL}${movieCbId}`)
				.then(movieDocument => {
					console.timeEnd('Load movie detail');
					console.time('Parse movie detail');
					let movie = new MovieModel(movieDocument.querySelector('body'), 'htmlDetailElement', movieCpId);
					console.timeEnd('Parse movie detail');
					lscache.set(movieCacheKey, movie, CACHE_MOVIE_DETAIL_TTL);
					resolve(movie);
				})
				.catch(reject);
		});
	}	
}

function getMoviesByIds(identifiers) {
	return Promise.all(identifiers.map(cpId => {
		return getMovieDetails.bind(null, cpId);
	}));
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
		return new Promise((resolve, reject) => {
			getHtml(MOST_VIEWED_MOVIES_URL)
				.then(moviesDocument => {
					let moviesIdentifiers = [...moviesDocument.querySelectorAll('.showpeliculas > .loph3 a')].map(movieLink => {
						return movieLink.getAttribute('href').match(/pelicula\/(\d*)\//)[1];
					});
					return moviesIdentifiers;
				})
				.then(getMoviesByIds)
				.then(resolve)
				.catch(reject)
		});
	}
}

export function getBestRated() {}
