'use strict';

module.exports = {
	app: {
		title: 'Freelance Manager',
		description: 'Freelance Manager',
		keywords: ''
	},
	port: process.env.PORT || 3000,
	templateEngine: 'swig',
	sessionSecret: 'MyFreelanceManagerSecret',
	sessionCollection: 'sessions',
	jwtSecret: 'MyJwtSecret',
	assets: {
		base: {
			css: [
				'public/lib/bootstrap/dist/css/bootstrap.css'
			],
			js: [
				'public/lib/jquery/dist/jquery.js',
				'public/lib/angular/angular.js',
				'public/lib/angular-resource/angular-resource.js',
				'public/lib/angular-animate/angular-animate.js',
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				'public/lib/angular-ui-utils/ui-utils.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
				'public/lib/bootstrap/dist/js/bootstrap.js',
				'public/lib/lodash/dist/lodash.js',
				'public/lib/angular-jwt/dist/angular-jwt.js',
				'public/lib/moment/moment.js',
				'public/lib/oclazyload/dist/ocLazyLoad.js'
			]			
		},
		lib: {
			css: [
				'public/lib/font-awesome/css/font-awesome.css',
				'public/lib/bootstrap/dist/css/bootstrap.css'
			],
			js: [
				'public/lib/jquery/dist/jquery.js',
				'public/lib/angular/angular.js',
				'public/lib/angular-resource/angular-resource.js',
				'public/lib/angular-animate/angular-animate.js',
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				'public/lib/angular-ui-utils/ui-utils.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
				'public/lib/bootstrap/dist/js/bootstrap.js',
				'public/lib/lodash/dist/lodash.js',
				'public/lib/angular-jwt/dist/angular-jwt.js',
				'public/lib/moment/moment.js',
				'public/lib/oclazyload/dist/ocLazyLoad.js'
			]
		},
		css: [
			'public/modules/**/css/*.css'
		],
		js: [
			'public/config.js',
			'public/application.js',
			'public/modules/*/*.js',
			'public/modules/*/*[!tests]*/*.js'
		],
		tests: [
			'public/lib/angular-mocks/angular-mocks.js',
			'public/modules/**/*.test.js'
		]
	}
};
