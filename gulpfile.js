var gulp = require('gulp'),
	gutil = require('gulp-util'),
	gcopy = require('gulp-copy'),
	postcss = require('gulp-postcss'),
	del = require('del'),
	runSequence = require('run-sequence'),
	webpack = require('webpack'),
	WebpackDevServer = require('webpack-dev-server'),
	webpackConfig = require('./webpack.config.js');

// PostCSS processors
var postcssProcessors = [
	require('precss')(),
	require('autoprefixer')({
		browsers: [
			'last 2 versions',
			'ie 10',
			'Firefox > 20'
		]
	})
];

// Cleab build directory
gulp.task('clean:all', function() {
	return del([
		'./dist/**/*'
	]);
});
gulp.task('clean:js', function() {
	return del([
		'./dist/**/*.js'
	]);
});

// Styles
gulp.task('styles', function() {
	return gulp.src('./src/styles/**/*.css')
		.pipe(postcss(postcssProcessors))
		.pipe(gulp.dest('./dist/styles'));
});

// Copy assets
gulp.task('copy:html', function() {
	return gulp.src('./src/index.html')
		.pipe(gcopy('./dist', {
			prefix: 1
		}));
});
gulp.task('copy:vendorStyles', function() {
	return gulp.src('./src/vendor/semantic/dist/components/**/*min.css')
		.pipe(gcopy('./dist/vendor/semantic/components', {
			prefix: 5
		}));
});
gulp.task('copy:fonts', function() {
	return gulp.src('./src/fonts/**/*')
		.pipe(gcopy('./dist/fonts', {
			prefix: 2
		}));
});
gulp.task('copy:images', function() {
	return gulp.src('./src/images/**/*')
		.pipe(gcopy('./dist/images', {
			prefix: 2
		}));
});

// Development server
gulp.task('webpack-dev-server', function(callback) {
	// Webpack compiler with its configuration
	var config = Object.create(webpackConfig);
	// config.debug = true;
	
	// Server and middleware options
	var serverConfig = {
		publicPath: config.output.publicPath,
		stats: {
			colors: true
		},
		inline: true,
		contentBase: './dist'
	};

	new WebpackDevServer(webpack(config), serverConfig).listen(8080, 'localhost', err => {
		if (err) {
			throw new gutil.PluginError('webpack-dev-server', err);
		}

		gutil.log('[webpack-dev-server]', 'http://localhost:8080/index.html');

		// keep the server alive or continue?
		// callback();
	});
});

// Production build
gulp.task('build:webpack', function(next) {
	// Modify some webpack config options
	var config = Object.create(webpackConfig);
	config.devtool = 'source-map';

	config.plugins = config.plugins.concat(
		new webpack.DefinePlugin({
			'process.env': {
				// This has effect on the react lib size
				'NODE_ENV': JSON.stringify('production')
			}
		}),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin()
	);

	// Run webpack
	webpack(config, function(err, stats) {
		if (err) {
			throw new gutil.PluginError('webpack:build', err);
		}
		gutil.log('[webpack:build]', stats.toString({ colors: true }));
		next();
	});
});

gulp.task('watch', function() {
	gulp.watch('./src/styles/**/*', ['styles']);
	gulp.watch('./src/index.html', ['copy:html']);
	gulp.watch('./src/fonts/**/*', ['copy:fonts']);
	gulp.watch('./src/images/**/*', ['copy:images']);
});

// gulp.task('init', ['clean:all', 'copy:html', 'copy:fonts', 'copy:images', 'copy:vendorStyles', 'styles']);
gulp.task('init', function(done) {
	runSequence('clean:all', ['copy:html', 'copy:fonts', 'copy:images', 'copy:vendorStyles', 'styles'], done);
});

// gulp.task('build', ['clean:js', 'build:webpack']);
gulp.task('build', function(done) {
	runSequence('clean:js', ['build:webpack'], done);
});

// Default task
gulp.task('default', ['watch', 'webpack-dev-server']);
