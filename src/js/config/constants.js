let constants = Object.freeze({
	events: {
		'NEW_PREMIERS_AVAILABLE': 'NEW_PREMIERS_AVAILABLE',
		'NEW_MOVIES_AVAILABLE': 'NEW_MOVIES_AVAILABLE',
		'SECTION_SELECTED': 'SECTION_SELECTED'
	},
	sections: {
		'premiers': 'premiers',
		'most-viewed': 'most-viewed',
		'best-rated': 'best-rated',
		'recently-added': 'recently-added'
	},
	cache: {
		'CACHE_PREMIERS_KEY': 'movies-premiers',
		'CACHE_RECENTLY_ADDED_KEY': 'movies-recently-added',
		'CACHE_MOST_VIEWED_KEY': 'movies-most-viewed',
		'CACHE_BEST_RATED_KEY': 'movies-best-rated'
	}
});

export default constants;