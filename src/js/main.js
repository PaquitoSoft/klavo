import React from 'react';
import ReactDOM from 'react-dom';
import lscache from 'lscache';

import App from './components/layout/app';

if (window.location.search.indexOf('reset') !== -1) {
	lscache.flush();
}

ReactDOM.render(<App />, document.getElementById('root'));
