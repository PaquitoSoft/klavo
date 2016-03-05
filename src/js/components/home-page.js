import React from 'react';
import lscache from 'lscache';
import eventsManager from '../plugins/events-manager';
import constants from '../config/constants';
import { getText } from '../plugins/i18n';
import * as moviesCatalogApi from '../api/movies-catalog';
import Message from './message';
import LoadingMessage from './loading-message';
import MovieSummary from './movie-summary';

class HomePage extends React.Component {

	constructor() {
		super();

		this.state = {
			movies: [],
			newMovies: [],
			selectedSection: 'none'
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
				this.setState({
					movies,
					selectedSection: section
				});
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
		this.loadMovies(this.props.params.section || constants.sections.premiers);
		
		eventsManager.on(constants.events.NEW_MOVIES_AVAILABLE, this.onNewMoviesAvailable);
		eventsManager.on(constants.events.SECTION_SELECTED, this.onNewSectionSelected);

		if (!lscache.get(constants.cache.CACHE_MOST_VIEWED_KEY)) {
			moviesCatalogApi.getMostViewed();
		}

		// setTimeout(() => {
		// 	this.setState({
		// 		newMovies: [this.state.movies.pop()]
		// 	});
		// }, 5000);
	}

	componentWillReceiveProps(nextProps) {
		let newSection = nextProps.params.section || constants.sections.premiers;
		if (this.state.selectedSection !== newSection) {
			console.debug('HomePage::componentDidUpdate# Updating home page with new section movies...');
			this.loadMovies(newSection);
			this.setState({
				selectedSection: newSection,
				movies: []
			})
		}
	}

	componentWillUnmount() {
		eventsManager.off(constants.events.NEW_MOVIES_AVAILABLE, this.onNewMoviesAvailable);
		eventsManager.off(constants.events.SECTION_SELECTED, this.onNewSectionSelected);
	}

	getNewMoviesMessage() {
		let subMessage = (
			<span>
				<a href="#" onClick={this.onLoadNewMoviesClick.bind(this)}>{getText('home-page.new-premiers-message.2')}</a>
				{getText('home-page.new-premiers-message.3')}
			</span>
		);
		return (
			<Message
				messageClasses="new-movies-available-msg"
				iconClasses="refresh"
				message={getText('home-page.new-premiers-message.1')}
				subMessage={subMessage}
			/>
		);
	}

	render() {
		let movies, newMoviesAvailableMessage;

		if (this.state.movies.length) {
			movies = this.state.movies.map((movie, index) => {
				return (<MovieSummary key={index} movie={movie} />);
			});
		} else {
			movies = (
				<LoadingMessage
					message={getText('movie-detail.loading.message')}
					subMessage={getText('home-page.loading-message.2')}
				/>
			);
		}

		if (this.state.newMovies.length) {
			newMoviesAvailableMessage = this.getNewMoviesMessage();
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