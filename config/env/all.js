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
			css: [
				'public/lib/clockpicker/dist/bootstrap-clockpicker.css',
				'public/lib/bootstrap-datepicker/css/datepicker3.css',
				'public/lib/ng-table/ng-table.min.css',
				'public/lib/chosen_v1.2.0/chosen.css',
			],
			js: [
				'public/lib/angular-route/angular-route.js',
				'public/lib/angular-cookies/angular-cookies.js',
				'public/lib/angular-animate/angular-animate.js',
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				'public/lib/angular-ui-utils/ui-utils.js',
				'public/lib/angular-sanitize/angular-sanitize.js',
				'public/lib/angular-resource/angular-resource.js',
				'public/lib/angular-jwt/dist/angular-jwt.js',

				'public/lib/ngstorage/ngStorage.js',
				'public/lib/oclazyload/dist/ocLazyLoad.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
				'public/lib/angular-loading-bar/build/loading-bar.js',
				'public/lib/bootstrap/dist/js/bootstrap.js',
				'public/lib/lodash/lodash.js',
				'public/lib/moment/moment.js',

				'public/lib/fastclick/lib/fastclick.js',
				'public/lib/screenfull/dist/screenfull.min.js',
				'public/lib/animo.js/animo.js',
				'public/lib/slimScroll/jquery.slimscroll.min.js',
				'public/lib/jquery-classyloader/js/jquery.classyloader.min.js',
				'public/lib/clockpicker/dist/bootstrap-clockpicker.js',
				'public/lib/bootstrap-datepicker/js/bootstrap-datepicker.js',
				'public/lib/ng-table/ng-table.min.js',
				'public/lib/Flot/jquery.flot.js',
				'public/lib/flot.tooltip/js/jquery.flot.tooltip.min.js',
				'public/lib/Flot/jquery.flot.resize.js',
				'public/lib/Flot/jquery.flot.pie.js',
				'public/lib/Flot/jquery.flot.time.js',
				'public/lib/Flot/jquery.flot.categories.js',
				'public/lib/flot-spline/js/jquery.flot.spline.min.js',
				'public/lib/chosen_v1.2.0/chosen.jquery.js',
				'public/lib/angular-chosen-localytics/chosen.js'
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
			'public/karma.js',
			'public/lib/angular-mocks/angular-mocks.js',
			'public/modules/**/*.test.js'
		],
		render: {
			js: [
				'public/lib/jquery/dist/jquery.js',
				'public/lib/angular/angular.js',
				'public/lib/modernizr/modernizr.js',
				'public/lib/angular-route/angular-route.js',
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				'public/lib/angular-jwt/dist/angular-jwt.js',
				'public/dist/render.js'
			]
		}
	}
};
