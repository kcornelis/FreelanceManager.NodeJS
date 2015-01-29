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

function initialize(){
	
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
}

if (process.env.NODE_ENV === 'test') {
	
	var db = mongoose.connect(config.db);
	initialize();
}
else {

	mongoose.connection.on("connected", function(ref) {
		initialize();
	});

	var db = mongoose.connect(config.db);
}

