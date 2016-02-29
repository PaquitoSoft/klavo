import React from 'react';
import * as moviesCatalogApi from '../../api/movies-catalog';
import eventsManager from '../../plugins/events-manager';
import constants from '../../plugins/constants';
import Header from './header';
import Footer from './footer';
import HomePage from '../home-page';

export default function App() {
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
