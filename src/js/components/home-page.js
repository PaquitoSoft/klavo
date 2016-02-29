import React from 'react';
import eventsManager from '../plugins/events-manager';
import constants from '../plugins/constants';
import { getText } from '../plugins/i18n';
import * as moviesCatalogApi from '../api/movies-catalog';

class HomePage extends React.Component {

	constructor() {
		super();

		this.state = {
			premierMovies: [],
			newPremierMovies: [],
			selectedSection: constants.sections.premiers
		};

		this.onNewPremiersAvailable = this.receiveNewPremiers.bind(this);
		this.onNewSectionSelected = this.updateVisibleSection.bind(this);
	}

	receiveNewPremiers(newPremierMovies) {
		this.setState({
			newPremierMovies
		});
	}

	updateVisibleSection(newSection) {
		console.debug('HomePage::updateVisibleSection# TODO');
	}

	onLoadNewPremiersClick(event) {
		event.preventDefault();
		this.setState({
			premierMovies: this.state.newPremierMovies.concat(this.state.premierMovies),
			newPremierMovies: []
		});
	}

	componentDidMount() {
		moviesCatalogApi.getPremiers()
			.then(movies => {
				console.info('These are the premier movies:');
				console.dir(movies);
				this.setState({premierMovies: movies});
			})
			.catch(err => {
				console.error(err);
				console.error(err.stack);
			});

		eventsManager.on(constants.events.NEW_PREMIERS_AVAILABLE, this.onNewPremiersAvailable);
		eventsManager.on(constants.events.SECTION_SELECTED, this.onNewSectionSelected);
	}

	componentWillUnmount() {
		eventsManager.off(constants.events.NEW_PREMIERS_AVAILABLE, this.onNewPremiersAvailable);
		eventsManager.off(constants.events.SECTION_SELECTED, this.onNewSectionSelected);
	}

	render() {
		let movies, newPremiersAvailableMessage;

		if (this.state.premierMovies.length) {
			movies = this.state.premierMovies.map((movie, index) => {
				return (<div className="item" key={index}>{movie.title}</div>);
			});
		} else {
			movies = (<div>Loading movies...</div>);
		}

		if (this.state.newPremierMovies.length) {
			newPremiersAvailableMessage = (
				<div className="ui info message new-movies-available-msg">
					<p>
						<span>{getText('home-page.new-premiers-message.1')}</span>
						<br/>
						<span>
							<a href="#" onClick={this.onLoadNewPremiersClick.bind(this)}>{getText('home-page.new-premiers-message.2')}</a>
							{getText('home-page.new-premiers-message.3')}</span>
					</p>
				</div>
			);
		}

		return (
			<div className="home-page">
				<h1 className="ui header">{getText(`header.category-${this.state.selectedSection}`)}</h1>
				{newPremiersAvailableMessage}
				<div className="ui list">
					{movies}
				</div>
			</div>
		);
	}

}

export default HomePage;