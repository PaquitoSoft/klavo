import React from 'react';
import eventsManager from '../../plugins/events-manager';
import { getText } from '../../plugins/i18n';
import constants from '../../config/constants';

class Header extends React.Component {

	constructor() {
		super();
	}

	render() {
		return (
			<div className="ui fixed inverted menu">
				<div className="ui container">
					<a href="/" className="header item">
						<img className="logo" src="/images/logo.png" width="35" height="35" />
						{getText('header.app-title')}
					</a>
					<div className="ui simple dropdown item">
						{getText('header.menu-title')} <i className="dropdown icon"></i>
						<div className="menu">
							<a className="item" href={`/movies/${constants.sections.premiers}`}>
								{getText('header.category-premiers')}
							</a>
							<a className="item" href={`/movies/${constants.sections['most-viewed']}`}>
								{getText('header.category-most-viewed')}
							</a>
							<a className="item" href={`/movies/${constants.sections['best-rated']}`}>
								{getText('header.category-best-rated')}
							</a>
							<a className="item" href={`/movies/${constants.sections['recently-added']}`}>
								{getText('header.category-recently-added')}
							</a>
						</div>
					</div>
				</div>
			</div>
		);
	}
	
}

export default Header;
