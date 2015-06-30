'use strict';

module.exports = {
	app: {
		title: 'Freelance Manager',
		description: 'A demo application in NodeJS',
		author: 'Kevin Cornelis',
		keywords: ''
	},
	port: process.env.PORT || 3000,
	templateEngine: 'swig',
	sessionSecret: 'MyFreelanceManagerSecret',
	sessionCollection: 'sessions',
	jwtSecret: 'MyJwtSecret',
	minification: {
		lib: {
			css: [
				'public/lib/flat-theme/dist/bootstrap.css',
				'public/lib/clockpicker/dist/bootstrap-clockpicker.css',
				'public/lib/bootstrap-datepicker/css/datepicker3.css',
				'public/lib/chosen/chosen.css',

				'public/lib/flat-theme/dist/flat-theme.css'
			],
			js: [
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				'public/lib/angular-ui-utils/ui-utils.js',
				'public/lib/angular-jwt/dist/angular-jwt.js',
				'public/lib/angular-local-storage/dist/angular-local-storage.js',
				'public/lib/angular-resource/angular-resource.js',
				'public/lib/angular-animate/angular-animate.js',

				'public/lib/bootstrap/dist/js/bootstrap.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
				'public/lib/clockpicker/dist/bootstrap-clockpicker.js',
				'public/lib/bootstrap-datepicker/js/bootstrap-datepicker.js',
				'public/lib/chosen/chosen.jquery.js',
				'public/lib/ng-table/dist/ng-table.js',
				
				'public/lib/lodash/lodash.js',
				'public/lib/moment/moment.js',

				'public/lib/flat-theme/dist/flat-theme.angular.js'
			]
		},
		fm: {
			css: [
				'public/modules/**/css/*.css'
			],
			js: [
				'public/config.js',
				'public/application.js',
				'public/modules/*/*.js',
				'public/modules/*/*[!tests]*/*.js'
			]
		}
	},
	assets: {
		fm: {
			css: [
				'public/lib/fontawesome/css/font-awesome.css',
				'public/lib/simple-line-icons/css/simple-line-icons.css',
				'public/dist/lib.min.css' ,
				'public/dist/application.min.css'
			],
			js: [
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/angular/angular.js',
				'public/lib/modernizr/modernizr.min.js',
				'public/dist/lib.min.js',
				'public/dist/application.min.js'
			]
		},
		fmRender: {
			js: [
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/angular/angular.min.js',
				'public/lib/modernizr/modernizr.min.js',
				'public/lib/angular-ui-router/release/angular-ui-router.min.js',
				'public/lib/angular-jwt/dist/angular-jwt.min.js',
				'public/dist/render.min.js'
			]
		},
		tests: [
			'public/karma.js',
			'public/lib/angular-mocks/angular-mocks.js',
			'public/modules/**/*.test.js'
		]
	}
};
