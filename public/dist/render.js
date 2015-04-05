// TODO unit test
var App = angular.module('freelancemanager renderer', ['ngRoute', 'ui.router', 'angular-jwt']);

App.config(['$locationProvider',

	function($locationProvider) {
		$locationProvider.hashPrefix('!');
	}
])

.factory('authInterceptor', ['$rootScope', '$q', '$window', function ($rootScope, $q, $window) {
	'use strict';

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
}])

.config(['$httpProvider', function ($httpProvider) {
	'use strict';

	$httpProvider.interceptors.push('authInterceptor');
}])

.run(['$rootScope', '$location', '$window', 'jwtHelper', function($rootScope, $location, $window, jwtHelper) {
	'use strict';

	$rootScope.$on('$stateChangeStart', function(event, nextRoute, currentRoute) {
			var loggedIn = $window.localStorage.token && !jwtHelper.isTokenExpired($window.localStorage.token);
			if (!loggedIn) {
					$location.path('/login');
			}
	});
}])

.config(['$stateProvider',
	function($stateProvider) {
		'use strict';

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
])

.controller('RenderInvoiceController', ['$rootScope', '$scope', '$http', '$stateParams',
	function ($rootScope, $scope, $http, $stateParams) {
		'use strict';

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
])

.directive('fmWith', 
	function () {
		'use strict';

		return {
			restrict: 'A',
			scope: true,
			controller: function ($scope, $attrs, $parse) {
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
		};
	}
)

.directive('fmDynamic', ['$compile', 
	function ($compile) {
		'use strict';
		
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
	}]
)

.filter('price',
	function(){
		'use strict';

		return function(price, digits, thoSeperator, decSeperator) {
			
			digits = (typeof digits === "undefined") ? 2 : digits;
			thoSeperator = (typeof thoSeperator === "undefined") ? "." : thoSeperator;
			decSeperator = (typeof decSeperator === "undefined") ? "," : decSeperator;
			price = price.toString();
			var _temp = price.split(".");
			var dig = (typeof _temp[1] === "undefined") ? "00" : _temp[1];

			dig = dig.toString();
			if (dig.length > digits) {
				dig = (Math.round(parseFloat("0." + dig) * Math.pow(10, digits))).toString();
			}
			for (var i = dig.length; i < digits; i++) {
				dig += "0";
			}

			var num = _temp[0];
			var s = "", ii = 0;
			for (var i = num.length - 1; i > -1; i--) {
				s = ((ii++ % 3 === 2) ? ((i > 0) ? thoSeperator : "") : "") + num.substr(i, 1) + s;
			}
			return s + decSeperator + dig;
		}
	}
)

.filter('leadingZeros', function () {
	return function (n, len) {
		var num = parseInt(n, 10);
		len = parseInt(len, 10);
		if (isNaN(num) || isNaN(len)) { return n; }
		num = ''+num;
		while (num.length < len) { num = '0'+num; }
		return num;
	};
});

angular.element(document).ready(function() {
	angular.bootstrap(document, ['freelancemanager renderer']);
});
