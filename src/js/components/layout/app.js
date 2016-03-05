import React from 'react';
import * as moviesCatalogApi from '../../api/movies-catalog';
import eventsManager from '../../plugins/events-manager';
import constants from '../../config/constants';
import Header from './header';
import Footer from './footer';
import Router from '../router';
import routesConfiguration from '../../config/routes-config';

export default function App(props) {
	return (
		<div>
			<Header />

			<div className="ui main container">
				<Router config={routesConfiguration} />
			</div>

			<Footer />
		</div>
	);
}
