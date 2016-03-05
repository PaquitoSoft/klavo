
const languageMap = Object.freeze({
	'Español': 'es',
	'Latino': 'ar',
	'Subtitulado': 'gb_ES'
});
const embbedableVideoServices = Object.freeze([
	'__Openload',
	'__Idowatch'
]);

function getMediaLinks(rows, cpId) {
	let result = [];
	if (rows) {
		result = rows.reduce((links, row) => {
			let columns = row.querySelectorAll('td');				

			// Sometimes they mix actual links with a non-links message column
			if (columns.length >= 4) {
				let urlLink = columns[0].querySelector('a');
				if (urlLink) {
					let url = urlLink.getAttribute('href');
					// There are non-direct links
					if (!/olimpo/.test(url)) {
						console.debug('MovieModel::getMediaLinks# Link language:', columns[2].innerText);
						let videoServiceName = columns[1].querySelector('span').innerText;
						links.push({
							url,
							service: videoServiceName,
							language: columns[2].innerText,
							languageCode: languageMap[columns[2].innerText] || 'ie',
							quality: columns[3].innerText,
							embeddable: embbedableVideoServices.indexOf(videoServiceName) !== -1
						});
					}
				}
			}

			return links;
		}, []);
	}

	return result;
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
			try {
				this.title = info[0].innerText;
			} catch(errrr) {
				console.warn('Movie:', cpId);
				console.log(errrr.stack);
			}
			
			this.coverUrl = data.querySelector('.ladouno figure img').getAttribute('src');
			this.year = info[2].innerText;
			this.genre = info[3].querySelector('a').innerText;
			this.description = data.querySelector('#enlaces>p').innerText;

			let trailerContainer = data.querySelector('.container_trailer iframe');
			if (trailerContainer) {
				this.trailerUrl = trailerContainer.getAttribute('src');
			}

			this.originalTitle = info[1].innerText;
			this.posterUrl = data.querySelector('.ladodos .background-pelicula').getAttribute('style').match(/url\((.*)\)/)[1];
			this.duration = info[4].innerText;
			this.rating = info[6].innerText;
			this.viewCount = data.querySelector('.menu_votos .vistos').innerText;

			this.mediaOnlineLinks = getMediaLinks([...data.querySelectorAll('#olmt tbody tr')], cpId);
			this.mediaDownloadLinks = getMediaLinks([...data.querySelectorAll('#dlmt tbody tr')], cpId);

			this.quality = '';
			this.languages = [];
			if (this.mediaOnlineLinks.length) {
				this.quality = this.mediaOnlineLinks[0].quality;
				this.mediaOnlineLinks.forEach(mediaLink => {
					if (this.languages.indexOf(mediaLink.language) !== -1) {
						this.languages.push(mediaLink.language);
					}
				});	
			}
		}

		this.createdAt = Date.now();
	}	

}