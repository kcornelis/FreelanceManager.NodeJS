'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init')(),
	config = require('./config/config'),
	mongoose = require('mongoose');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

var app;
var initialized = false;

mongoose.connection.on("connected", function(ref) {
	
	console.log("Connected to db");

	if(initialized)
		return;

	// Init the express application
	var app = require('./config/express')(db);

	// Start the app by listening on <port>
	app.listen(config.port);

	// Expose app
	exports = module.exports = app;

	// Logging initialization
	console.log('Application started on port ' + config.port);
	initialized = true;
});

// Bootstrap db connection
var db = mongoose.connect(config.db);