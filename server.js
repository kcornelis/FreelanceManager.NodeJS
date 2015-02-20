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
var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, 
				replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } };       


function initialize(db){
	
	console.log('Connected to db');

	if(initialized)
		return;

	// Init the express application
	var app = require('./config/express')(mongoose);

	// Start the app by listening on <port>
	app.listen(config.port);

	// Expose app
	exports = module.exports = app;

	// Logging initialization
	console.log('Application started on port ' + config.port);	

	initialized = true;	
}

if (process.env.NODE_ENV === 'test') {
	
	mongoose.connect(config.db);
	initialize();
}
else {

	var db = mongoose.connection;

	db.on('error',function (err) { 
		console.log('Mongoose default connection error: ' + err);
	}); 

	db.on('disconnected', function () { 
		console.log('Mongoose default connection disconnected'); 
	});

	// If the Node process ends, close the Mongoose connection 
	process.on('SIGINT', function() {  
		db.close(function () { 
			console.log('Mongoose default connection disconnected through app termination'); 
			process.exit(0); 
		}); 
	}); 

	db.once('open', function() {
		initialize();	
	});

	mongoose.connect(config.db, options);
}

