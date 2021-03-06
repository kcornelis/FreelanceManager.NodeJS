'use strict';

/**
* Global declarations
*   => require_config();
*/
global.require_config = function() {
   return require(__dirname + '/config.js');
};
global.require_infrastructure = function(item) {
   return require(__dirname + '/../app/infrastructure/' + item);
};

/**
 * Module dependencies.
 */
var express = require('express'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	compress = require('compression'),
	methodOverride = require('method-override'),
	cookieParser = require('cookie-parser'),
	helmet = require('helmet'),
	mongoStore = require('connect-mongo')({
		session: session
	}),
	config = require('./config'),
	consolidate = require('consolidate'),
	path = require('path'),
	pck = require('../package.json');

module.exports = function(db) {
	
	// Initialize express app
	var app = express();

	// Globbing model files
	config.getGlobbedFiles('./app/**/*.model.js').forEach(function(modelPath) {
		require(path.resolve(modelPath));
	});

	// Setting application local variables
	app.locals.title = config.app.title;
	app.locals.description = config.app.description;
	app.locals.version = pck.version;
	app.locals.keywords = config.app.keywords;
	app.locals.jsFiles = config.getJavaScriptAssets();
	app.locals.renderJsFiles = config.getRenderJavaScriptAssets();
	app.locals.cssFiles = config.getCSSAssets();

	// Passing the request url to environment locals
	app.use(function(req, res, next) {
		res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		next();
	});

	// Should be placed before express.static
	app.use(compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		level: 9
	}));

	// Showing stack errors
	app.set('showStackError', true);

	// Set swig as the template engine
	app.engine('.html', consolidate[config.templateEngine]);

	// Set views path and view engine
	app.set('view engine', '.html');
	app.set('views', './app/web/views');

	// Environment dependent middleware
	if (process.env.NODE_ENV === 'development') {
		// Enable logger (morgan)
		app.use(morgan('dev'));

		// Disable views cache
		app.set('view cache', false);
	} else if (process.env.NODE_ENV === 'production') {
		app.locals.cache = 'memory';
	}

	// Request body parsing middleware should be above methodOverride
	app.use(bodyParser.urlencoded());
	app.use(bodyParser.json({ limit: '10mb' }));
	app.use(methodOverride());

	// Enable jsonp
	app.enable('jsonp callback');

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
		  
		// intercept OPTIONS method
		if ('OPTIONS' === req.method) {
		  res.send(200);
		}
		else {
		  next();
		}
	});

	// CookieParser should be above session
	app.use(cookieParser());

	// Express MongoDB session storage
	app.use(session({
		saveUninitialized: true,
		resave: true,
		secret: config.sessionSecret,
		store: new mongoStore({
			db: db.connection.db,
			collection: config.sessionCollection
		})
	}));

	// Use helmet to secure Express headers
	app.use(helmet.xframe());
	app.use(helmet.iexss());
	app.use(helmet.contentTypeOptions());
	app.use(helmet.ienoopen());
	app.use(helmet.cacheControl());
	app.disable('x-powered-by');

	// Setting the app router and static folder
	app.use(express.static(path.resolve('./public')));

	// Globbing routing files
	config.getGlobbedFiles('./app/**/*.routes.js').forEach(function(routePath) {
		require(path.resolve(routePath))(app);
	});

	// Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
	app.use(function(err, req, res, next) {
		// If the error object doesn't exists
		if (!err) return next();

		if(err.name === 'UnauthorizedError') {

			console.log('UnauthorizedError');
			res.status(401).render('401', {
				error: 'Unauthorized'
			});

		}else{

			// Log it
			console.error(err.stack);

			// Error page
			res.status(500).render('500', {
				error: err.stack
			});
		}
	});

	// Assume 404 since no middleware responded
	app.use(function(req, res) {
		res.status(404).render('404', {
			url: req.originalUrl,
			error: 'Not Found'
		});
	});

	return app;
};
