import React from 'react';
import { getMovie } from '../api/movies-catalog';
import { getText } from '../plugins/i18n';
import LoadingMessage from './loading-message';

class MovieDetailPage extends React.Component {

	constructor() {
		super();
		this.state = {
			movie: null,
			selectedMovieUrl: '',
			selectedOnlineLinkIndex: -1
		};
	}
	
	componentDidMount() {
		getMovie(this.props.params.cpId)
			.then(movie => {
				console.debug('MovieDetailPage::componentDidMount# Movie details:', movie);
				this.setState({movie});
			})
			.catch(error => {
				// TODO Show error to user
				console.error('MovieDetailPage::componentDidMount# Could not load movie detail:', error);
				console.error(error.stack);
			});
	}	

	onlineLinkSelected(linkInfo, selectedOnlineLinkIndex, event) {
		console.debug('MovieDetailPage::onlineLinkSelected# Selected URL:', linkInfo);
		if (linkInfo.embeddable) {
			event.preventDefault();
			this.setState({
				selectedMovieUrl: linkInfo.url,
				selectedOnlineLinkIndex
			});
		}
	}

	render() {
		let movie = this.state.movie;

		if (!movie) {
			return (<div><LoadingMessage message={getText('movie-detail.loading.message')} /></div>);
		}

		let onlineLinks = movie.mediaOnlineLinks.map((linkInfo, index) => {
			let [langCode, subtitlesCode] = linkInfo.languageCode.split('_'),
				selectedIndex = this.state.selectedOnlineLinkIndex,
				labelClass = '';

			if (selectedIndex === index) {
				labelClass = 'blue';
			} else if (linkInfo.embeddable) {
				labelClass = 'green';
			}

			return (
				<div key={index} 
					onClick={this.onlineLinkSelected.bind(this, linkInfo, index)}
					className={`ui label lang-label ${labelClass}`}>
					<a href={linkInfo.url} target="_blank">
						<i className={`${langCode} flag`}></i> {linkInfo.quality}
					</a>
				</div>
			);
		});

		let video = (<img className="poster" src={movie.posterUrl}></img>);
		if (this.state.selectedMovieUrl) {
			video = (<iframe src={this.state.selectedMovieUrl} />); // sandbox=""
		}

		return (
			<div className="ui grid movie-detail-page">
				<div className="eight wide column">
					<div className="row video-player-container">
						{video}
					</div>
					<div className="row movie-online-links">
						<div className="ui labels">
							{onlineLinks}
						</div>
					</div>
				</div>
				<div className="eight wide column">
					<div className="ui items">
						<div className="item">
							<div className="content">
								<span className="header">{movie.title}</span>
								<div className="meta">
									<div className="ui basic label">Año: {movie.year}</div>
									<div className="ui basic label">Género: {movie.genre}</div>
								</div>
								<div className="description">
									<p>{movie.description}</p>
								</div>
								<div className="extra">
									<span>Duración: {movie.duration}</span>
									<span>Puntuación: {movie.rating}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

}

export default MovieDetailPage;
