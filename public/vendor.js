var fm = fm || {};

fm.vendor = (function() {
	'use strict';

	var vendorConfiguration = [
	{
		name: 'flot',
		files: ['lib/flot/jquery.flot.js']
	}, 
	{
		name: 'flot-plugins',
		files: ['lib/flot/jquery.flot.resize.js',
			'lib/flot/jquery.flot.pie.js', 
			'lib/flot/jquery.flot.time.js',
			'lib/flot/jquery.flot.categories.js', 
			'lib/flot/jquery.flot.stack.js',
			'lib/flot-spline/js/jquery.flot.spline.js', 
			'lib/flot.tooltip/js/jquery.flot.tooltip.js',
			'lib/angular-flot/angular-flot.js']
	}, 
	{
		name: 'xlsx',
		files: ['lib/js-xlsx/dist/xlsx.core.min.js']
	}];

	function configure($ocLazyLoadProvider) {
		$ocLazyLoadProvider.config({
			modules: vendorConfiguration
		});
	}

	configure.$inject = ['$ocLazyLoadProvider'];

	angular.module(fm.config.moduleName).config(configure);

	function resolve() {
		var _args = arguments;
		return {
			vendor: ['$ocLazyLoad','$q', function ($ocLL, $q) {
				// creates promise to chain dynamically
				function andThen(_arg) {
					// also support a function that returns a promise
					if(typeof _arg === 'function')
						return promise.then(_arg);
					else return promise.then(function() {
						return $ocLL.load( _arg );
					});
				}

				// Creates a promise chain for each argument
				var promise = $q.when(1); // empty promise
				for(var i=0, len=_args.length; i < len; i ++) {

					promise = andThen(_args[i]);
				}
				return promise;
			}]};
	}

	return {
		resolve: resolve
	};

})();

