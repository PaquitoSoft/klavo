import React from 'react';
import * as moviesCatalogApi from '../../api/movies-catalog';
import eventsManager from '../../plugins/events-manager';
import constants from '../../plugins/constants';
import Header from './header';
import Footer from './footer';
import HomePage from '../home-page';

class App extends React.Component {

	constructor() {
		super();
		this.state = {
			premierMovies: [],
			newPremierMovies: []
		};
		this.newPremiersHandler = this.handleNewPremiers.bind(this);
	}

	componentDidMount() {
		// moviesCatalogApi.getPremiers()
		// 	.then(movies => {
		// 		console.info('These are the premier movies:');
		// 		console.dir(movies);
		// 		this.setState({premierMovies: movies});
		// 	})
		// 	.catch(err => {
		// 		console.error(err);
		// 		console.error(err.stack);
		// 	});
		eventsManager.on(constants.events.NEW_PREMIERS_AVAILABLE, this.newPremiersHandler);
	}

	componentWillUnmount() {
		eventsManager.off(constants.events.NEW_PREMIERS_AVAILABLE, this.newPremiersHandler);
	}

	handleNewPremiers(newPremierMovies) {
		console.log('AppComponent::handleNewPremiers# TODO Let the user know we have new premier movies available:', newPremierMovies.length);
		this.setState({
			newPremierMovies
		});
	}

	loadNewPremiers(event) {
		event.preventDefault();
		this.setState({
			premierMovies: this.state.newPremierMovies.concat(this.state.premierMovies),
			newPremierMovies: []
		});
	}

	render() {
		let movies, newPremiersAvailableMessage;

		if (this.state.premierMovies.length) {
			movies = this.state.premierMovies.map((movie, index) => {
				return (<li key={index}>{movie.title}</li>);
			});
		} else {
			movies = (<div>Loading movies...</div>);
		}

		if (this.state.newPremierMovies.length) {
			newPremiersAvailableMessage = (
				<p>
					<span>There are new premier movies available.</span>
					<br/>
					<span><a href="#" onClick={this.loadNewPremiers.bind(this)}>Click here</a> to load them.</span>
				</p>
			);
		}

		/*
			<section>
				<h1>Klavo</h1>
				{newPremiersAvailableMessage}
				<ul>
					{movies}
				</ul>
			</section>
		*/

		return (
			<div>
				<Header />

				<div className="ui main container">
					<HomePage />
				</div>

				<Footer />
			</div>
		);
	}
}

export default App;
