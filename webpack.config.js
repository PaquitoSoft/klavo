var webpack = require('webpack');

module.exports = {
	entry: './src/js/main.js',
	output: {
		path: require('path').resolve('./dist/js'),
		filename: 'app-dist.js',
		publicPath: '/js/'
	},
	devtool: 'source-map',
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: /(node_modules)/,
				loader: 'babel',
				query: {
					presets: ['es2015', 'react']
				}
			}
		]
	},
	plugins: [
		new webpack.ProvidePlugin({
			'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch',
			'es6-promise': 'es6-promise'
		})
	]
};
