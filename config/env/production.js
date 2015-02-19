'use strict';

module.exports = {
	db: process.env.MongoConnectionString,
	sessionSecret: process.env.SessionSecret,
	jwtSecret: process.env.JWTSecret,
	assets: {
		lib: {
			css: [ 'public/dist/lib.min.css' ],
			js: ['public/dist/lib.min.js']
		},
		css: [ 'public/dist/application.min.css' ],
		js: [ 'public/dist/application.min.js' ]
	}
};