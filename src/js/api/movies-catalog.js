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

const CACHE_LASTUPDATES = 'movies-lastupdates';
const CACHE_PREMIERS_KEY = 'movies-premiers';
// const CACHE_MOVIES_TTL = 60 /* minutes */ * 24 /* hours */ * 7 /* days */; // One week (in minutes)
const CACHE_MOVIES_TTL = 1;

function loadPremiers() {
	return new Promise((resolve, reject) => {
		console.time('Load premiers');
		getHtml(PREMIERS_MOVIES_URL)
			.then(premiersDocument => {
				console.timeEnd('Load premiers');
				let movies;
				let cachedPremiers = lscache.get(CACHE_PREMIERS_KEY) || [];

				if (cachedPremiers.length) {
					console.warn('A');
					movies = [...premiersDocument.querySelectorAll('.showpeliculas .postsh')].map(movieEl => {
						return new MovieModel(movieEl, 'htmlElement');
					});
				} else {
					console.warn('B');
					let raw = [...premiersDocument.querySelectorAll('.showpeliculas .postsh')].slice(0, 10);
					movies = raw.map(movieEl => {
						return new MovieModel(movieEl, 'htmlElement');
					});
				}				

				// console.time('Parse premiers');				
				// let movies = [...premiersDocument.querySelectorAll('.showpeliculas .postsh')].map(movieEl => {
				// 	return new MovieModel(movieEl, 'htmlElement');
				// });
				// console.timeEnd('Parse premiers');
				// console.log('MoviesCatalogApi::loadPremiers# Storing movies:', movies.length);
				// lscache.set(CACHE_PREMIERS_KEY, movies, CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
				console.debug('MoviesCatalogApi::loadPremiers# Returning movies:', movies.length);
				resolve(movies);
			})
			.catch(reject);
	});
}

function getNewPremiers() {
	return new Promise((resolve, reject) => {
		let cachedPremiers = lscache.get(CACHE_PREMIERS_KEY) || [];
		
		loadPremiers()
			.then(movies => {
				// let newMovies = movies.filter((movie) => {
				// 	return cachedPremiers.findIndex(listItem => { return listItem.cpId === movie.cpId; }) === -1;
				// });
				// console.log(`New premiers list length: ${newMovies.length}`);
				// resolve(newMovies);
				resolve(movies.filter((movie) => {
					return cachedPremiers.findIndex(listItem => { return listItem.cpId === movie.cpId; }) === -1;
				}));
			})
			.catch(reject);
	});
}

function updatePremiers() {
	console.log('MoviesCatalogApi::updatePremiers# Updating premiers...');
	getNewPremiers()
		.then(newMovies => {
			if (newMovies.length) {
				let cachedPremiers = lscache.get(CACHE_PREMIERS_KEY) || [];
				console.debug('MoviesCatalogApi::updatePremiers# Updating premiers with new movies...', newMovies.length, cachedPremiers.length);
				lscache.set(CACHE_PREMIERS_KEY, newMovies.concat(cachedPremiers), CACHE_MOVIES_TTL); // Last parameter is TTL in minutes
				eventsManager.trigger(constants.events.NEW_PREMIERS_AVAILABLE, newMovies);
			} else {
				console.debug('MoviesCatalogApi::updatePremiers# There are no new premiers.');
			}
		})
		.catch(error => {
			console.error('MoviesCatalogApi::updatePremiers# Error updating premiers:', error);
			console.error(error.stack);
		});
}

export function getPremiers() {
	let cachedPremiers = lscache.get(CACHE_PREMIERS_KEY);

	if (cachedPremiers) {
		console.debug('MoviesCatalogApi::updatePremiers# Returning cached premiers...');

		// TODO Try to update premiers list if it has passed a long time since the last time we did it
		setTimeout(updatePremiers, 4);
		
		return Promise.resolve(cachedPremiers);

	} else {
		return new Promise((resolve, reject) => {
			loadPremiers()
				.then(premiers => {
					lscache.set(CACHE_PREMIERS_KEY, premiers, CACHE_MOVIES_TTL); // Last parameter is TTL in minutes		
					resolve(premiers);
				})
				.catch(reject);
		});
	}
}

export function getMostViewed() {}

export function getBestRated() {}

export function getRecentlyAdded() {}
