import React from 'react';
import lscache from 'lscache';
import eventsManager from '../plugins/events-manager';
import constants from '../config/constants';
import { getText } from '../plugins/i18n';
import * as moviesCatalogApi from '../api/movies-catalog';
import MovieSummary from './movie-summary';

class HomePage extends React.Component {

	constructor() {
		super();

		this.state = {
			movies: [],
			newMovies: [],
			selectedSection: constants.sections.premiers
		};

		this.sectionsMovieLoadersMap = {
			[constants.sections.premiers]: moviesCatalogApi.getPremiers,
			[constants.sections['recently-added']]: moviesCatalogApi.getRecentlyAdded,
			[constants.sections['most-viewed']]: moviesCatalogApi.getMostViewed,
			[constants.sections['best-rated']]: moviesCatalogApi.getBestRated
		}

		this.onNewMoviesAvailable = this.receiveNewMovies.bind(this);
		this.onNewSectionSelected = this.updateVisibleSection.bind(this);
	}

	loadMovies(section) {
		this.sectionsMovieLoadersMap[section].call()
			.then(movies => {
				this.setState({movies});
			})
			.catch(err => {
				console.error(err);
				console.error(err.stack);
			});
	}

	receiveNewMovies(newMovies) {
		this.setState({
			newMovies
		});
	}

	updateVisibleSection(newSection) {
		if (this.state.selectedSection !== newSection) {
			this.setState({
				selectedSection: newSection,
				movies: []
			});
			this.loadMovies(newSection);
		}
	}

	onLoadNewMoviesClick(event) {
		event.preventDefault();
		this.setState({
			movies: this.state.newMovies.concat(this.state.movies),
			newMovies: []
		});
	}

	componentDidMount() {
		this.loadMovies(constants.sections.premiers);		
		
		eventsManager.on(constants.events.NEW_MOVIES_AVAILABLE, this.onNewMoviesAvailable);
		eventsManager.on(constants.events.SECTION_SELECTED, this.onNewSectionSelected);	
	}

	componentWillUnmount() {
		eventsManager.off(constants.events.NEW_MOVIES_AVAILABLE, this.onNewMoviesAvailable);
		eventsManager.off(constants.events.SECTION_SELECTED, this.onNewSectionSelected);
	}

	render() {
		let movies, newMoviesAvailableMessage;

		if (this.state.movies.length) {
			movies = this.state.movies.map((movie, index) => {
				return (<MovieSummary key={index} movie={movie} />);
			});
		} else {
			movies = (
				<div className="ui icon message loading-message">
					<i className="notched circle loading icon"></i>
					<div className="content">
						<div className="header">
							{getText('home-page.loading-message.1')}
						</div>
						<p>{getText('home-page.loading-message.2')}</p>
					</div>
				</div>
			);
		}

		if (this.state.newMovies.length) {
			newMoviesAvailableMessage = (
				<div className="ui icon message new-movies-available-msg">
					<i className="refresh icon"></i>
					<div className="content">
						<div className="header">
							{getText('home-page.new-premiers-message.1')}
						</div>
						<p>
							<a href="#" onClick={this.onLoadNewMoviesClick.bind(this)}>{getText('home-page.new-premiers-message.2')}</a>
							{getText('home-page.new-premiers-message.3')}
						</p>
					</div>
				</div>
			);
		}

		return (
			<div className="home-page">
				<h1 className="ui header">{getText(`header.category-${this.state.selectedSection}`)}</h1>
				{newMoviesAvailableMessage}
				<div className="ui link cards movies-grid">
					{movies}
				</div>
			</div>
		);
	}

}

export default HomePage;