import React from 'react';
import eventsManager from '../../plugins/events-manager';
import { getText } from '../../plugins/i18n';
import constants from '../../plugins/constants';

class Header extends React.Component {

	constructor() {
		super();
	}

	onSectionSelected(selectedSection, event) {
		event.preventDefault();
		eventsManager.trigger(constants.events.SECTION_SELECTED, selectedSection);
	}

	render() {
		return (
			<div className="ui fixed inverted menu">
				<div className="ui container">
					<a href="/" className="header item">
						<img className="logo" src="/images/logo.png" />
						{getText('header.app-title')}
					</a>
					<div className="ui simple dropdown item">
						{getText('header.menu-title')} <i className="dropdown icon"></i>
						<div className="menu">
							<a className="item" href="#" onClick={this.onSectionSelected.bind(this, constants.sections.premiers)}>
								{getText('header.category-premiers')}
							</a>
							<a className="item" href="#" onClick={this.onSectionSelected.bind(this, constants.sections['most-viewed'])}>
								{getText('header.category-most-viewed')}
							</a>
							<a className="item" href="#" onClick={this.onSectionSelected.bind(this, constants.sections['best-rated'])}>
								{getText('header.category-best-rated')}
							</a>
							<a className="item" href="#" onClick={this.onSectionSelected.bind(this, constants.sections['recently-added'])}>
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

/*
	Original template menu: (http://semantic-ui.com/examples/fixed.html)
	<div className="ui fixed inverted menu">
		<div className="ui container">
			<a href="#" className="header item">
				<img className="logo" src="/images/logo.png" />
				Klavo
			</a>
			<a href="#" className="item">Home</a>
			<div className="ui simple dropdown item">
				Dropdown <i className="dropdown icon"></i>
				<div className="menu">
					<a className="item" href="#">Link Item 1</a>
					<a className="item" href="#">Link Item 2</a>
					<div className="divider"></div>
					<div className="header">Header Item</div>
					<div className="item">
						<i className="dropdown icon"></i>
						Sub Menu
						<div className="menu">
							<a className="item" href="#">Link Item 3</a>
							<a className="item" href="#">Link Item 4</a>
						</div>
					</div>
					<a className="item" href="#">Link Item 5</a>
				</div>
			</div>
		</div>
	</div>
*/
