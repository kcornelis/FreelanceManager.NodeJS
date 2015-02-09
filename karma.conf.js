'use strict';

/**
 * Module dependencies.
 */
var applicationConfiguration = require('./config/config');

// Karma configuration
module.exports = function(config) {

	var files = [];
	files = files.concat(applicationConfiguration.assets.lib.js);
	files = files.concat(applicationConfiguration.assets.js);
	files = files.concat(applicationConfiguration.assets.tests);
	files.push({ pattern: 'public/i18n/en.json', included: false, served: true });
	files.push({ pattern: 'public/lib/**/*.js', included: false, served: true });
	files.push({ pattern: 'public/unmanagedbowerlib/**/*.js', included: false, served: true });
	files.push({ pattern: 'public/modules/**/*.html', included: false, served: true });
	//console.log(JSON.stringify(files));

	config.set({
		// Frameworks to use
		frameworks: ['jasmine', 'sinon-chai'],

		// List of files / patterns to load in the browser
		files: files,

		proxies: {
		  '/i18n/': 'http://localhost:9876/base/public/i18n/',
		  '/lib/': 'http://localhost:9876/base/public/lib/',
		  '/unmanagedbowerlib/': 'http://localhost:9876/base/public/unmanagedbowerlib/',
		  '/modules/': 'http://localhost:9876/base/public/modules/'		  
		},

		// Test results reporter to use
		// Possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		//reporters: ['progress'],
		reporters: ['progress'],

		// Web server port
		port: 9876,

		// Enable / disable colors in the output (reporters and logs)
		colors: true,

		// Level of logging
		// Possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,

		// Enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		browsers: ['PhantomJS'],

		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,

		// Continuous Integration mode
		// If true, it capture browsers, run tests and exit
		singleRun: true
	});
};
