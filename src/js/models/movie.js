
function getMediaLinks(rows) {
	return rows.map(row => {
		let columns = row.querySelectorAll('td');
		return {
			url: columns[0].querySelector('a').getAttribute('href'),
			service: columns[1].querySelector('span').innerText,
			language: columns[2].innerText,
			quality: columns[3].innerText
		}
	});	
}

export default class Movie {

	constructor(data, dataType, cpId) {
		if (dataType === 'htmlSummaryElement') {
			let titleLink = data.querySelector('.info .info-title');
			this.cpId = titleLink.getAttribute('href').match(/\/pelicula\/(\d*)\//)[1];
			this.title = titleLink.innerText;
			this.coverUrl = data.querySelector('.poster .poster-image-container img').getAttribute('src');
			this.quality = data.querySelector('.poster .rating-number').innerText;
			this.year = data.querySelector('.poster .under-title').innerText;
			this.genre = data.querySelector('.info .under-title').innerText;
			this.languages = [...data.querySelectorAll('.info > img[src*="wp-content/uploads"]')].map(langIcon => {
				return langIcon.getAttribute('src').match(/wp-content\/uploads\/\d{4}\/\d{2}\/(.*)\.png$/)[1];
			});

			let trailerLink = data.querySelector('.info a[href*="youtube"]');
			this.trailerUrl = trailerLink ? trailerLink.getAttribute('href') : null;
		} else if (dataType === 'htmlDetailElement') {

			let info = data.querySelectorAll('#informacion p');

			this.cpId = cpId;
			this.title = info[0].innerText;
			this.coverUrl = data.querySelector('.ladouno figure img').getAttribute('src');
			this.year = info[2].innerText;
			this.genre = info[3].querySelector('a').innerText;
			this.trailerUrl = data.querySelector('.container_trailer iframe').getAttribute('src');

			this.originalTitle = info[1].innerText;
			this.posterUrl = data.querySelector('.ladodos .background-pelicula').getAttribute('style').match(/url\((.*)\)/[1]);
			this.duration = info[4].innerText;
			this.rating = info[6].innerText;
			this.viewCount = data.querySelector('.menu_votos .vistos').innerText;

			this.mediaOnlineLinks = getMediaLinks([...data.querySelectorAll('#olmt tbody tr')]);
			this.mediaDownloadLinks = getMediaLinks([...data.querySelectorAll('#dlmt tbody tr')]);

			this.quality = this.mediaOnlineLinks[0].quality;
			this.languages = [];
			this.mediaOnlineLinks.forEach(mediaLink => {
				if (this.languages.indexOf(mediaLink.language) !== -1) {
					this.languages.push(mediaLink.language);
				}
			});
		}

		this.createdAt = Date.now();
	}	

}