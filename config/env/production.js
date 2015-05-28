'use strict';

module.exports = {
	db: process.env.MongoConnectionString,
	sessionSecret: process.env.SessionSecret,
	jwtSecret: process.env.JWTSecret,
	assets: {
		base: {
			css: [
				'public/lib/fontawesome/css/font-awesome.css',
				'public/lib/simple-line-icons/css/simple-line-icons.css',
			],
			js: [
				'public/lib/jquery/dist/jquery.js',
				'public/lib/angular/angular.js',
				'public/lib/modernizr/modernizr.js'
			]
		},
		lib: {
			css: [ 'public/dist/lib.min.css' ],
			js: [ 'public/dist/lib.min.js' ]
		},
		css: [ 'public/dist/application.min.css' ],
		js: [ 'public/dist/application.min.js' ],
		render: {
			js: [
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/angular/angular.min.js',
				'public/lib/modernizr/modernizr.js',
				'public/lib/angular-ui-router/release/angular-ui-router.min.js',
				'public/lib/angular-jwt/dist/angular-jwt.min.js',
				'public/dist/render.min.js'
			]
		}
	}
};