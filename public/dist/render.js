// TODO unit test
(function() {
	'use strict';

	function config($locationProvider) {
		$locationProvider.hashPrefix('!');
	}

	function authInterceptor($rootScope, $q, $window) {
		return {
			request: function (config) {
				config.headers = config.headers || {};
				if ($window.localStorage.token) {
					config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
				}
				return config;
			},
			response: function (response) {
				return response || $q.when(response);
			}
		};
	}

	function authInterceptorConfig($httpProvider) {
		$httpProvider.interceptors.push('authInterceptor');
	}

	function authentication($rootScope, $location, $window, jwtHelper) {
		$rootScope.$on('$stateChangeStart', function(event, nextRoute, currentRoute) {
				var loggedIn = $window.localStorage.token && !jwtHelper.isTokenExpired($window.localStorage.token);
				if (!loggedIn) {
						$location.path('/login');
				}
		});
	}

	function routeRegistration($stateProvider) {

		$stateProvider.state('invoice', {
			url: '/invoice/:id',
			controller: 'RenderInvoiceController',
			templateUrl: '/modules/invoice/views/render.html'
		})

		.state('invoicepreview', {
			url: '/invoicepreview?invoice',
			controller: 'RenderInvoiceController',
			templateUrl: '/modules/invoice/views/render.html'
		});
	}

	function renderInvoiceController($rootScope, $scope, $http, $stateParams) {
		if($stateParams.invoice){
			$scope.invoice = JSON.parse($stateParams.invoice);
		}
		else {
			$http.get('/api/public/invoices/' + $stateParams.id)
				.success(function (data, status, headers, config) {
					$scope.invoice = data;
				});
		}
	}

	function withDirective() {

		function withController($scope, $attrs, $parse) {
			$scope.$parent.$watch($attrs.fmWith, function (oldVal, newVal) {
				var withObj = $scope.$parent[$attrs.fmWith];
				(function copyPropertiesToScope(withObj) {
					for (var prop in withObj) {

						if (withObj.hasOwnProperty(prop)) {
							Object.defineProperty($scope, prop, {
								enumerable: true,
								configurable: true,
								get: $parse(prop).bind($scope, withObj, $scope.$parent),
								set: $parse(prop).assign.bind($scope, withObj, $scope.$parent),
							});
						}
					}
				})(withObj);
			});
		}

		withController.$inject = ['$scope', '$attrs', '$parse'];

		return {
			restrict: 'A',
			scope: true,
			controller: withController
		};
	}

	function dynamicDirective($compile) {
		return {
			restrict: 'A',
			replace: true,
			link: function (scope, ele, attrs) {
				scope.$watch(attrs.fmDynamic, function(html) {
					ele.html('<div class="fill" data-fm-with=\'' + attrs.fmDynamicBind + '\'>' + html + '</div>');
					$compile(ele.contents())(scope);
				});
			}
		};
	}

	function numberFilter(){
		return function(number, digits, thoSeperator, decSeperator) {
			
			digits = (typeof digits === 'undefined') ? 2 : digits;
			thoSeperator = (typeof thoSeperator === 'undefined') ? '' : thoSeperator;
			decSeperator = (typeof decSeperator === 'undefined') ? ',' : decSeperator;

			var splittedNumber = number.toString().split('.');
			var numberDecimals = ((typeof splittedNumber[1] === 'undefined') ? '' : splittedNumber[1]).toString();
			var numberWhole = splittedNumber[0];

			// if digits < 0 then leave the decimal part like it was
			if(digits >= 0) {
				// digits to long, strip them
				if (numberDecimals.length > digits) {
					numberDecimals = (Math.round(parseFloat('0.' + numberDecimals) * Math.pow(10, digits))).toString();
				}
				for (var i = numberDecimals.length; i < digits; i++) {
					numberDecimals += '0';
				}
			}

			var formattedWholeNumber = '', thoCounter = 0;
			for (var i = numberWhole.length - 1; i > -1; i--) {
				formattedWholeNumber = ((thoCounter++ % 3 === 2) ? ((i > 0) ? thoSeperator : '') : '') + numberWhole.substr(i, 1) + formattedWholeNumber;
			}

			return (numberDecimals !== '') ? (formattedWholeNumber + decSeperator + numberDecimals) : formattedWholeNumber;
		}
	}

	function leadingZerosFilter() {
		return function (n, len) {
			var num = parseInt(n, 10);
			len = parseInt(len, 10);
			if (isNaN(num) || isNaN(len)) { return n; }
			num = ''+num;
			while (num.length < len) { num = '0'+num; }
			return num;
		};
	}

	config.$inject = ['$locationProvider'];
	authInterceptor.$inject = ['$rootScope', '$q', '$window'];
	authInterceptorConfig.$inject = ['$httpProvider'];
	authentication.$inject = ['$rootScope', '$location', '$window', 'jwtHelper'];
	routeRegistration.$inject = ['$stateProvider'];
	renderInvoiceController.$inject = ['$rootScope', '$scope', '$http', '$stateParams'];
	withDirective.$inject = [];
	dynamicDirective.$inject = ['$compile'];
	numberFilter.$inject = [];
	leadingZerosFilter.$inject = [];

	angular.module('freelancemanager renderer', ['ui.router', 'angular-jwt'])
		.config(config)
		.factory('authInterceptor', authInterceptor)
		.config(authInterceptorConfig)
		.run(authentication)
		.config(routeRegistration)
		.controller('RenderInvoiceController', renderInvoiceController)
		.directive('fmWith', withDirective)
		.directive('fmDynamic', dynamicDirective)
		.filter('price', numberFilter)
		.filter('fmPrice', numberFilter)
		.filter('fmNumber', numberFilter)
		.filter('leadingZeros', leadingZerosFilter);

	angular.element(document).ready(function() {
		angular.bootstrap(document, ['freelancemanager renderer']);
	});
})();
