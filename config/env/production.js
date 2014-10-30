'use strict';

module.exports = {
	assets: {
		lib: {
			css: [
				'public/lib/bootstrap/dist/css/bootstrap.min.css',
				'public/lib/clockpicker/dist/bootstrap-clockpicker.min.css',
				'public/lib/components-font-awesome/css/font-awesome.min.css'
			],
			js: [
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/angular/angular.min.js',
				'public/lib/angular-resource/angular-resource.min.js',
				'public/lib/angular-animate/angular-animate.min.js',
				'public/lib/angular-ui-router/release/angular-ui-router.min.js',
				'public/lib/angular-ui-utils/ui-utils.min.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
				'public/lib/bootstrap/dist/js/bootstrap.min.js',
				'public/lib/clockpicker/dist/bootstrap-clockpicker.min.js',
				'public/lib/lodash/dist/lodash.min.js',
				'public/lib/angular-jwt/dist/angular-jwt.min.js',
				'public/lib/moment/min/moment.min.js'
			]
		},
		css: 'public/dist/application.min.css',
		js: 'public/dist/application.min.js'
	}
};