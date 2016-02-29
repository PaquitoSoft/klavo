
export default class Movie {

	constructor(data, dataType) {
		if (dataType === 'htmlElement') {
			let titleLink = data.querySelector('.info .info-title');
			this.cpId = titleLink.getAttribute('href').match(/\/pelicula\/(\d*)\//)[1],
			this.title = titleLink.innerText,
			this.posterUrl = data.querySelector('.poster .poster-image-container img').getAttribute('src'),
			this.quality = data.querySelector('.poster .rating-number').innerText,
			this.year = data.querySelector('.poster .under-title').innerText,
			this.genre = data.querySelector('.info .under-title').innerText,
			this.languages = [...data.querySelectorAll('.info > img[src*="wp-content/uploads"]')].map(langIcon => {
				return langIcon.getAttribute('src').match(/wp-content\/uploads\/\d{4}\/\d{2}\/(.*)\.png$/)[1];
			});

			let trailerLink = data.querySelector('.info a[href*="youtube"]');
			this.trailerUrl = trailerLink ? trailerLink.getAttribute('href') : null			
		}

		this.createdAt = Date.now();
	}

}