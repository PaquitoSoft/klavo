import React from 'react';
import routerEngine from 'page';

class Router extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			currentComponent: this.props.defaultComponent,
			routeContext: {}
		};

		// TODO Sync with browser location
		routerEngine({
			dispatch: false, // perform initial dispatch
			hashbang: true
		});

		Object.keys(this.props.config).forEach(routePath => {
			routerEngine(routePath, this.handleRouteChange.bind(this, this.props.config[routePath]))
		});
	}
	
	handleRouteChange(routeComponent, routeContext) {
		console.debug('Router::handleRouteChange# Navigting:', routeComponent, routeContext);
		this.setState({
			currentComponent: routeComponent,
			routeContext
		});
	}

	componentDidMount() {
		// TODO Listen for navigation events (a component wants to force a navigate)
	}

	render() {
		// TODO Second parameter is props; Third parameter is children
		return React.createElement(this.state.currentComponent, {
			pathname: this.state.routeContext.pathname,
			path: this.state.routeContext.path,
			params: this.state.routeContext.params,
			queryString: this.state.routeContext.querystring
		});
	}
}

Router.propTypes = {
	// TODO How do I validate this is a Component?
	defaultComponent: React.PropTypes.func.isRequired,
	config: React.PropTypes.object.isRequired
};

export default Router;
