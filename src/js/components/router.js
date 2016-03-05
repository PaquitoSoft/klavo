import React from 'react';
import routerEngine from 'page';

class Router extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			currentComponent: null,
			routeContext: {}
		};

		Object.keys(this.props.config).forEach(routePath => {
			routerEngine(routePath, this.handleRouteChange.bind(this, this.props.config[routePath]))
		});		
	}
	
	handleRouteChange(routeComponent, routeContext) {
		console.debug('Router::handleRouteChange# Navigating to:', routeComponent.name, routeContext);
		this.setState({
			currentComponent: routeComponent,
			routeContext
		});
	}

	componentDidMount() {
		
		// Sync with browser location
		routerEngine({
			dispatch: true, // fire routing on page load
			hashbang: true	// whether using old fashioned hash URLs or not
		});

		// TODO Listen for navigation events (a component may want to force a navigate)
	}

	render() {
		if (!this.state.currentComponent) {
			return (<div></div>);
		} else {
			// Scroll to top after transitioning to a new page
			setTimeout(window.scrollTo.bind(window, 0, 0), 4);

			// Second parameter is props; Third parameter is children
			return React.createElement(this.state.currentComponent, {
				pathname: this.state.routeContext.pathname,
				path: this.state.routeContext.path,
				params: this.state.routeContext.params,
				queryString: this.state.routeContext.querystring
			});	
		}
	}
}

Router.propTypes = {
	config: React.PropTypes.object.isRequired
};

export default Router;
