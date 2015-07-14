var fm = fm || {};

fm.config = (function() {
	'use strict';

	return {
		moduleName: 'freelancemanager',
		moduleDependencies: ['LocalStorageModule', 
			'ngAnimate', 
			'ui.bootstrap', 
			'ui.router', 
			'ui.utils',
			'oc.lazyLoad',
			'ngResource', 
			'ft', 
			'ngTable',
			'localytics.directives',
			'angular-loading-bar']
	};
})();

var fm = fm || {};

fm.module = (function() {
	'use strict';

	function register(moduleName) {
		var m = angular.module(moduleName, []);

		// Add the module to the AngularJS configuration file
		angular.module(fm.config.moduleName).requires.push(moduleName);

		return m;
	}

	return {
		register: register
	};
})();

(function() {
	'use strict';
	
	angular.module(fm.config.moduleName, fm.config.moduleDependencies);

	// Setting HTML5 Location Mode
	angular.module(fm.config.moduleName).config(['$locationProvider',
		function($locationProvider) {
			$locationProvider.hashPrefix('!');
		}
	]);

	angular.element(document).ready(function() {
		angular.bootstrap(document, [fm.config.moduleName]);
	});
})();

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


(function() {
	'use strict';

	fm.module.register('fmAccount');
})();

(function() {
	'use strict';

	fm.module.register('fmCore');
})();

(function() {
	'use strict';

	fm.module.register('fmCrm');
})();

(function() {
	'use strict';

	fm.module.register('fmInvoice');
})();

(function() {
	'use strict';

	fm.module.register('fmProject');
})();

(function() {
	'use strict';

	fm.module.register('fmSettings');
})();

(function() {
	'use strict';

	fm.module.register('fmTime');
})();

(function() {
	'use strict';

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
				//if (response.status === 401) {
				// handle the case where the user is not authenticated
				//}
				return response || $q.when(response);
			}
		};
	}

	function authInterceptorConfig($httpProvider) {
		$httpProvider.interceptors.push('fmAccountAuthInterceptor');
	}

	function authentication($rootScope, $state, $window, $location, jwtHelper) {
		$rootScope.$on('$stateChangeStart', function(event, nextRoute, currentRoute) {
				var loggedIn = $window.localStorage.token && !jwtHelper.isTokenExpired($window.localStorage.token);
				if (!nextRoute.access || nextRoute.access.requiredLogin) {
					if(!loggedIn) {
						event.preventDefault();
						$state.go('login', { r: $location.url() });
					}
				}
		});
	}

	authInterceptor.$inject = ['$rootScope', '$q', '$window'];
	authInterceptorConfig.$inject = ['$httpProvider'];
	authentication.$inject = ['$rootScope', '$state', '$window', '$location', 'jwtHelper'];

	angular.module('fmAccount', ['angular-jwt']);

	angular.module('fmAccount').factory('fmAccountAuthInterceptor', authInterceptor);
	angular.module('fmAccount').config(authInterceptorConfig);
	angular.module('fmAccount').run(authentication);

})();

(function() {
	'use strict';

	function routeRegistration($stateProvider) {
		$stateProvider.

		// the login page does not require loggin
		state('login', {
			url: '/login?r',
			templateUrl: 'modules/account/views/login.html',
			access: { requiredLogin: false }
		}).	

		state('app.account', {
			url: '/account',
			templateUrl: 'modules/account/views/account.html',
			access: { requiredLogin: true }
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmAccount').config(routeRegistration);

})();

(function() {
	'use strict';

	function accountInfoController($scope, $window, jwtHelper, Account) {

		var token = jwtHelper.decodeToken($window.localStorage.token);

		$scope.account = Account.get({ id: token.id });

		$scope.save = function () {
			$scope.isSaving = true;

			Account.save(token.id, $scope.account, function() {
				$scope.isSaving = false;
			}, 
			function(err) {
				$scope.isSaving = false;
			});
		};
	}

	accountInfoController.$inject = ['$scope', '$window', 'jwtHelper', 'Account'];

	angular.module('fmAccount').controller('AccountInfoController', accountInfoController);

})();

(function() {
	'use strict';

	function loginController($rootScope, $scope, $http, $window, $stateParams, $location, jwtHelper) {

		delete $window.localStorage.token;
		delete $window.localStorage.user;

		$scope.user = { email: '', password: '' };
		$scope.error = '';
		
		$scope.submit = function () {
			$http.post('/security/authenticate', $scope.user)
				.success(function (data, status, headers, config) {

					var decrypted = jwtHelper.decodeToken(data.token);
					$window.localStorage.user = decrypted.fullName;

					$window.localStorage.token = data.token;
					$location.path($stateParams.r ? decodeURIComponent($stateParams.r) : '/').search({ }); // TODO unit test
				})
				.error(function (data, status, headers, config) {
					
					// Erase the token if the user fails to log in
					delete $window.localStorage.token;
					delete $window.localStorage.user;

					// Handle login errors here
					$scope.error = 'Invalid email or password';
					$scope.user.password = '';
				});
		};
	}

	loginController.$inject = ['$rootScope', '$scope', '$http', '$window', '$stateParams', '$location', 'jwtHelper'];

	angular.module('fmAccount').controller('AccountLoginController', loginController);
})();

(function() {
	'use strict';

	function accountPasswordController($scope, $window, jwtHelper, Account) {

		var token = jwtHelper.decodeToken($window.localStorage.token);

		$scope.password = {
			old: '',
			new: '',
			confirm: ''
		};

		$scope.save = function () {
			$scope.isSaving = true;
			$scope.hasError = false;

			Account.changePassword({ id: token.id }, { oldPassword: $scope.password.old, newPassword: $scope.password.new },
				function() {

					$scope.isSaving = false;

					$scope.password.old = '';
					$scope.password.new = '';
					$scope.password.confirm = '';

					$scope.accountPasswordForm.$setPristine();
				},
				function(err) {

					$scope.isSaving = false;
					$scope.hasError = true;
				});
		};
	}

	accountPasswordController.$inject = ['$scope', '$window', 'jwtHelper', 'Account'];

	angular.module('fmAccount').controller('AccountPasswordController', accountPasswordController);

})();

(function() {
	'use strict';

	function config($rootScope, $state, $stateParams, $window) {

		// Set reference to access them from any scope
		$rootScope.$state = $state;
		$rootScope.$stateParams = $stateParams;
		$rootScope.$storage = $window.localStorage;

		// Scope Globals
		// ----------------------------------- 
		$rootScope.app = {
			name: 'Freelance Manager',
			description: 'A demo application in NodeJS',
			author: 'Kevin Cornelis',
			year: ((new Date()).getFullYear())
		};
	}

	function configureLoadingBarProvider(cfpLoadingBarProvider) {
		cfpLoadingBarProvider.parentSelector = '#content';
		cfpLoadingBarProvider.includeSpinner = false;
		cfpLoadingBarProvider.includeBar = true;
	}

	config.$inject = ['$rootScope', '$state', '$stateParams',  '$window'];
	configureLoadingBarProvider.$inject = ['cfpLoadingBarProvider'];

	angular.module('fmCore').run(config);
	angular.module('fmCore').config(configureLoadingBarProvider);
})();

(function() {
	'use strict';

	angular.module('fmCore').constant('const_mediaquery', {
		'desktopLG': 1200,
		'desktop': 992,
		'tablet': 768,
		'mobile': 480
	});
})();

(function() {
	'use strict';
	
	function routeRegistration($stateProvider, $urlRouterProvider) {

		// Redirect to the dashboard view when route not found
		$urlRouterProvider.otherwise('/app/dashboard');

		$stateProvider

		.state('app', {
			url: '/app',
			abstract: true,
			templateUrl: 'modules/core/views/app.html',
			controller: 'AppController'
		})

		.state('app.dashboard', {
			url: '/dashboard',
			title: 'Dashboard',
			templateUrl: 'modules/core/views/dashboard.html'
		});
	}

	routeRegistration.$inject = ['$stateProvider', '$urlRouterProvider'];

	angular.module('fmCore').config(routeRegistration);
})();

(function() {
	'use strict';

	function controller($rootScope, $scope, $state, cfpLoadingBar) {
		// TODO register for state changes and change the title
		// $rootScope.currTitle = $state.current.title;
		// $rootScope.pageTitle = function() {
		// 	return $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
		// };
		$rootScope.pageTitle = function() {
			return $rootScope.app.name + ' - ' + $rootScope.app.description;
		};

		// TODO unit test
		$rootScope.$on('$stateChangeStart', function() {
			if($('#content').length)
				cfpLoadingBar.start();
		});

		$rootScope.$on('$stateChangeSuccess', function(event) {
			event.targetScope.$watch('$viewContentLoaded', function () {
				cfpLoadingBar.complete();
			});
		});
	}

	controller.$inject = ['$rootScope', '$scope', '$state', 'cfpLoadingBar'];

	angular.module('fmCore').controller('AppController', controller);
})();

// TODO unit test
(function() {
	'use strict';
	
	function addErrorForDirective() {
		return {
			link: function(scope, element, attrs) {
				
				scope.$watch(attrs.fmAddErrorFor, function(formValue) {

					scope.$watch(attrs.fmAddErrorFor + '.$invalid', function() {

						if(formValue.$touched && formValue.$invalid && !formValue.$pristine)
							element.addClass('has-error');
						else element.removeClass('has-error');
					});
					scope.$watch(attrs.fmAddErrorFor + '.$touched', function() {

						if(formValue.$touched && formValue.$invalid && !formValue.$pristine)
							element.addClass('has-error');
						else element.removeClass('has-error');
					});				
				});
			}
		};
	}

	addErrorForDirective.$inject = [];

	angular.module('fmCore').directive('fmAddErrorFor', addErrorForDirective);
})();

(function() {
	'use strict';

	function autofocusDirective($timeout, $parse) {
		return {
			link: function(scope, element, attrs) {
				if(attrs.autofocusCondition) {
					 scope.$watch(
						function () { return $parse(attrs.autofocusCondition)(); },
						function (newVal) { 
							if(newVal) { 
								$timeout(function() {
									element[0].focus(); 
								}, 100);
							}
						}
					);
				} else {
					$timeout(function() {
						element[0].focus(); 
					}, 100);
				}
			}
		};
	}
	
	autofocusDirective.$inject = ['$timeout', '$parse'];

	angular.module('fmCore').directive('autofocus', autofocusDirective);
})();

(function() {
	'use strict';

	function clockpickerDirective() {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				element.clockpicker({
					donetext: 'DONE',
					autoclose: true
				});
			}
		};
	}
	
	clockpickerDirective.$inject = [];

	angular.module('fmCore').directive('fmClockpicker', clockpickerDirective);
})();

// TODO unit test
// TODO use open source directive
(function() {
	'use strict';
	
	function datepickerDirective($timeout) {
		return {
			restrict: 'A',
			require: '?ngModel',
			scope: {
				fmDatepickerDatechanged: '&'
			},
			link: function(scope, element, attrs, ngModel, timeout) {

				var position = attrs.fmDatepickerHPosition || 'right';
				element.datepicker({
					format: attrs.fmDatepickerFormat || 'yyyy-mm-dd',
					autoclose: true,
					orientation: 'auto ' + position,
					todayBtn: 'linked'
				})
				.on('changeDate', function(date) { 

					var dateTxt = date.format(attrs.fmDatepickerFormat || 'yyyy-mm-dd');
					if (scope.fmDatepickerDatechanged) {
						
						scope.$apply(function() { 
							scope.fmDatepickerDatechanged({date: dateTxt});
						}); 
					}
				});
			}
		};
	}

	datepickerDirective.$inject = ['$timeout'];

	angular.module('fmCore').directive('fmDatepicker', datepickerDirective);
})();

// TODO unit test
(function() {
	'use strict';

	function dynamicDirective($compile) {
		return {
			restrict: 'A',
			replace: true,
			link: function (scope, ele, attrs) {
				scope.$watch(attrs.fmDynamic, function(html) {
					ele.html('<div data-fm-with=\'' + attrs.fmDynamicBind + '\'>' + html + '</div>');
					$compile(ele.contents())(scope);
				});
			}
		};
	}
	
	dynamicDirective.$inject = ['$compile'];

	angular.module('fmCore').directive('fmDynamic', dynamicDirective);
})();

// TODO unit test
(function() {
	'use strict';

	function hrefDirective() {
		return {
			restrict: 'A',
			compile: function(element, attr) {
				return function(scope, element) {
					if(attr.ngClick || attr.href === '' || attr.href === '#') {

						if( !element.hasClass('dropdown-toggle') )
							element.on('click', function(e) {

								e.preventDefault();
								e.stopPropagation();
							});
					}
				};
			}
		 };
	}
	
	hrefDirective.$inject = [];

	angular.module('fmCore').directive('href', hrefDirective);
})();

// TODO unit test
(function() {
	'use strict';

	function iframeDirective($compile) {
		return {
			restrict: 'A',
			link: function (scope, ele, attrs) {
				scope.$watch(attrs.fmIframe, function(html) {
					var compiled = $compile(angular.element('<div data-fm-with=\'' + attrs.fmIframeBind + '\'>' + html + '</div>'))(scope);
					$(ele[0].contentDocument.body).html(compiled);
				});
			}
		};
	}
	
	iframeDirective.$inject = ['$compile'];

	angular.module('fmCore').directive('fmIframe', iframeDirective);
})();

(function() {
	'use strict';

	function matchDirective ($parse) {
		return {
			require: '?ngModel',
			restrict: 'A',
			link: function(scope, elem, attrs, ctrl) {
				if(!ctrl) {
					if(console && console.warn) {

						console.warn('Match validation requires ngModel to be on the element');
					}
					return;
				}

				var matchGetter = $parse(attrs.fmMatch);

				function getMatchValue() {

					var match = matchGetter(scope);
					if(angular.isObject(match) && match.hasOwnProperty('$viewValue')) {

						match = match.$viewValue;
					}
					return match;
				}

				scope.$watch(getMatchValue, function() {

					ctrl.$validate();
				});

				ctrl.$validators.match = function() {

					return ctrl.$viewValue === getMatchValue();
				};
			}
		};
	}
	
	matchDirective.$inject = ['$parse'];

	angular.module('fmCore').directive('fmMatch', matchDirective);
})();

// TODO unit test
// TODO use open source directive (for flot)
(function() {
	'use strict';

	function piechartDirective() {

		return{
			restrict: 'E',
			link: function(scope, elem, attrs) {

				
				var chart = null,
					options = {
					series: {
						pie: {
							show: true,
							radius: 1,
							label: {
								show: true,
								radius: 2/3,
								formatter: function (label, series) {
									return '<div style="font-size:8pt; text-align:center; padding:2px; color:white;">' + label + '<br/>' + Math.round(series.percent) + '%</div>';
								},
								threshold: 0.1
							}
						}
					},
					legend: {
						show: false
					}
				};

				scope.$watch(attrs.ngModel, function(v) {

					if(!chart) {

						if(v) {
							chart = $.plot(elem, v , options);
							elem.show();
						}
					}else{
						chart.setData(v);
						chart.setupGrid();
						chart.draw();
					}
				});
			}
		};
	}
	
	piechartDirective.$inject = [];

	angular.module('fmCore').directive('piechart', piechartDirective);
})();

// TODO unit test
(function() {
	'use strict';

	function withDirective() {
		function controller($scope, $attrs, $parse) {
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

		controller.$inject = ['$scope', '$attrs', '$parse'];

		return {
			restrict: 'A',
			scope: true,
			controller: controller
		};
	}
	
	withDirective.$inject = [];

	angular.module('fmCore').directive('fmWith', withDirective);
})();

(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/accounts/:id', { id: '@id' },
		{ 
			changePassword: { method:'POST', url: '/api/public/accounts/:id/changepassword', params: { id: '@id' } }
		}); 
	}

	factory.$inject = ['$resource'];

	angular.module('fmCore').factory('Account', factory);
})();

(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/companies/:id', { id: '@id' }); 
	}

	factory.$inject = ['$resource'];

	angular.module('fmCore').factory('Company', factory);
})();

(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/invoices/:id', { id: '@id' },
		{
			preview: { method:'POST', url: '/api/public/invoices/preview', isArray: false },
			bydate: { method:'GET', url: '/api/public/invoices/bydate/:from/:to', params: { from: '@from', to: '@to' }, isArray: true },
			getinfoforperiodpercustomer: { method:'GET', url: '/api/public/invoices/getinfoforperiodpercustomer/:from/:to', params: { from: '@from', to: '@to' }, isArray: true }
		});
	}

	factory.$inject = ['$resource'];

	angular.module('fmCore').factory('Invoice', factory);
})();

(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/projects/:id', { id: '@id' },
		{ 
			active: { method:'GET', url: '/api/public/projects/active', isArray: true },
			hide: { method:'POST', url: '/api/public/projects/:id/hide', isArray: false },
			unhide: { method:'POST', url: '/api/public/projects/:id/unhide', isArray: false },
			changetasks: { method:'POST', url: '/api/public/projects/:id/changetasks', isArray: false }
		});
	}

	factory.$inject = ['$resource'];

	angular.module('fmCore').factory('Project', factory);
})();

(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/templates/:id', { id: '@id' },
		{ 
			active: { method:'GET', url: '/api/public/templates/active', isArray: true },
			hide: { method:'POST', url: '/api/public/templates/:id/hide', isArray: false },
			unhide: { method:'POST', url: '/api/public/templates/:id/unhide', isArray: false }
		});
	}

	factory.$inject = ['$resource'];

	angular.module('fmCore').factory('Template', factory);
})();

(function() {
	'use strict';

	function factory($resource) {
		return $resource('/api/public/timeregistrations/:id', { id: '@id' },
		{ 
			search: { method:'GET', url: '/api/public/timeregistrations/search', isArray: true },
			bydate: { method:'GET', url: '/api/public/timeregistrations/bydate/:date', params: { date: '@date' }, isArray: true },
			byrange: { method:'GET', url: '/api/public/timeregistrations/byrange/:from/:to', params: { from: '@from', to: '@to' }, isArray: true },
			uninvoiced: { method:'GET', url: '/api/public/timeregistrations/uninvoiced', isArray: true },
			getinfoforperiod: { method:'GET', url: '/api/public/timeregistrations/getinfoforperiod/:from/:to', params: { from: '@from', to: '@to' } },
			getinfoforperiodpertask: { method:'GET', url: '/api/public/timeregistrations/getinfoforperiodpertask/:from/:to', params: { from: '@from', to: '@to' }, isArray: true },
			saveMultiple: { method:'POST', url: '/api/public/timeregistrations/multiple', isArray: true }
		});
	}

	factory.$inject = ['$resource'];

	angular.module('fmCore').factory('TimeRegistration', factory);
})();

// TODO unit test
(function() {
	'use strict';

	function factory($q, $rootScope) {
		
		var service = function(data) {
			angular.extend(this, data);
		};

		service.readFile = function(file) {

			var deferred = $q.defer();
			var reader = new FileReader();

			reader.onload = function(e) {
				var data = e.target.result;
				var workbook = XLSX.read(data, {type: 'binary'});
				deferred.resolve(convertWorkbook(workbook));
			};

			reader.readAsBinaryString(file);

			return deferred.promise;
		};

		function convertWorkbook(workbook) {
			var sheets = {};
			_.forEachRight(workbook.SheetNames, function(sheetName) {
				var sheet = workbook.Sheets[sheetName];
				sheets[sheetName] = convertSheet(sheet);
			});

			return sheets;
		}

		function convertSheet(sheet) {

			var range = XLSX.utils.decode_range(sheet['!ref']);
			var sheetData = [], header = [];

			_.forEachRight(_.range(range.s.r, range.e.r + 1), function(row) {
				var rowData = [];
				_.forEachRight(_.range(range.s.c, range.e.c + 1), function(column) {
					var cellIndex = XLSX.utils.encode_cell({
						'c': column,
						'r': row
					});
					var cell = sheet[cellIndex];
					rowData[column] = cell ? cell.v : undefined;
				});
				if(row === 0)
					header = rowData;
				else sheetData[row - 1] = rowData;
			});

			return {
				'header': header,
				'data': sheetData,
				'name': sheet.name,
				'col_size': range.e.c + 1,
				'row_size': range.e.r
			};
		}
		return service;
	}

	factory.$inject = ['$q', '$rootScope'];

	angular.module('fmCore').factory('XLSXReader', factory);
})();

(function() {
	'use strict';
	
	function formatdateFilter() {
		return function(a) {

			if(_.has(a, 'year') && _.has(a, 'month') && _.has(a, 'day')) {

				return a.year + '-' + ('00' + a.month).slice(-2) + '-' + ('00' + a.day).slice(-2);
			}
			else return '-';
		};
	}

	formatdateFilter.$inject = [];

	angular.module('fmCore').filter('formatdate', formatdateFilter);
})();

(function() {
	'use strict';

	function formattimeFilter() {
		return function(a) {
			if(_.has(a, 'hour') && _.has(a, 'minutes')) {
				return ('00' + a.hour).slice(-2) + ':' + ('00' + a.minutes).slice(-2);
			}
			else if(_.isNumber(a)) {
				var hour = Math.floor(a / 60);
				var minutes = Math.floor(a - (hour * 60));
				if(hour > 99) {
					return hour + ':' + ('00' + minutes).slice(-2); 
				}else{
				  return ('00' + hour).slice(-2) + ':' + ('00' + minutes).slice(-2);
				}
			}
			else return '-';
		};
	}
	
	formattimeFilter.$inject = [];

	angular.module('fmCore').filter('formattime', formattimeFilter);
})();

(function() {
	'use strict';

	function momentFilter() {
		return function(date, format) {

			return date.format(format);
		};
	}	
	
	momentFilter.$inject = [];

	angular.module('fmCore').filter('moment', momentFilter);
})();

(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.companies', {
			url: '/crm/companies',
			templateUrl: 'modules/crm/views/companies.html',
			controller: 'CompaniesController'
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmCrm').config(routeRegistration);
})();

(function() {
	'use strict';

	function controller($scope, $modal, Company) {

		$scope.getAllCompanies = function() {
			Company.query(function(companies) {

				$scope.companies = _.sortBy(companies, 'name');
			});
		};

		$scope.openCompany = function(company) {

			var createDialog = $modal.open({
				templateUrl: '/modules/crm/views/editcompany.html',
				controller: 'CompanyDialogController',
				resolve: {
					toUpdate: function () {
						return company;
					}
				}
			});

			createDialog.result.then(function (company) {
				var c = _.find($scope.companies, { 'id': company.id });
				if(c) angular.copy(company, c);
				else $scope.companies.push(company);
			});		
		};
	}

	controller.$inject = ['$scope', '$modal', 'Company'];

	angular.module('fmCrm').controller('CompaniesController', controller);
})();

(function() {
	'use strict';

	function controller($scope, Company, toUpdate) {

		$scope.originalCompany = toUpdate;
		$scope.newCompany = toUpdate === undefined;
		toUpdate = toUpdate || { };
		$scope.company =  { 
			name: toUpdate.name,
			number: toUpdate.number,
			vatNumber: toUpdate.vatNumber,
			address: toUpdate.address ? {
				line1: toUpdate.address.line1,
				line2: toUpdate.address.line2,
				postalcode: toUpdate.address.postalcode,
				city: toUpdate.address.city,
			} : null
		};
		
		$scope.isBusy = false;
		$scope.message = '';

		$scope.ok = function () {
			showMessage('Saving company...');

			var id = $scope.newCompany ? {} : { id: $scope.originalCompany.id };

			Company.save(id, $scope.company,
				function(data) { 
					hideMessage();
					$scope.$close(data);
				},
				function(err) { 
					showMessage('An error occurred...'); 
				});
		};

		$scope.cancel = function () {
			$scope.$dismiss('cancel');
		};

		function showMessage(message) {
			$scope.isBusy = true;
			$scope.message = message;
		}

		function hideMessage() {
			$scope.isBusy = false;
			$scope.message = '';
		}
	}

	controller.$inject = ['$scope', 'Company', 'toUpdate'];

	angular.module('fmCrm').controller('CompanyDialogController', controller);
})();

(function() {
	'use strict';

	function controller($scope, Company) {

		$scope.companies = Company.query();
		$scope.company = {};

		$scope.ok = function () {
			$scope.$close(_.find($scope.companies, function(c) { return c.id === $scope.company.id; }));
		};

		$scope.cancel = function () {
			$scope.$dismiss('cancel');
		};
	}

	controller.$inject = ['$scope', 'Company'];

	angular.module('fmCrm').controller('SearchCompanyDialogController', controller);
})();

(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.invoice_create', {
			url: '/invoice/create',
			templateUrl: 'modules/invoice/views/create.html',
			controller: 'CreateInvoiceController'
		})

		.state('app.invoice_overview', {
			url: '/invoice/overview/:from/:to',
			templateUrl: 'modules/invoice/views/overview.html',
			controller: 'InvoiceOverviewController',
			params: {
				from: function() { return moment().startOf('year').format('YYYYMMDD'); },
				to: function() { return moment().endOf('year').format('YYYYMMDD'); }
			}
		})

		.state('app.invoice_report', {
			url: '/invoice/report/:from/:to',
			templateUrl: 'modules/invoice/views/report.html',
			controller: 'InvoiceReportController',
			resolve: fm.vendor.resolve('flot', 'flot-plugins'),
			params: {
				from: function() { return moment().startOf('year').format('YYYYMMDD'); },
				to: function() { return moment().endOf('year').format('YYYYMMDD'); }
			}
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmInvoice').config(routeRegistration);
})();

(function() {
	'use strict';

	function controller($scope, $state, $stateParams, $modal, $sce, Project, TimeRegistration, Template, Invoice) {

		// Wizard helpers
		// **************
		var steps;

		function createsteps(q) {
			steps = [];
			for(var i = 1; i <= q; i++) steps[i] = false;
		}

		function activate(step) {
			for(var i in steps) {
				steps[i] = false;
			}
			steps[step] = true;
		}

		$scope.init = function() {
			createsteps(4);
			activate(1);
		};

		$scope.active = function(step) {
			return !!steps[step];
		};

		// Prefetch data
		// **************

		Project.query(function(projects) {
			$scope.projects = _.sortByAll(projects, ['company.name', 'name']);
		});

		$scope.templates = Template.active();	

		// WIZART STEP 1 (time registrations)
		// **********************************
		
		$scope.search = {
			project: null,
			from: null,
			to: null,
			invoiced: false,
			billable: true
		};

		$scope.searchTimeRegistrations = function() {
			$scope.loading = true;
			$scope.includeAllTimeRegistrations = false;

			TimeRegistration.search(
			{ 
				project: $scope.search.project, 
				from: $scope.search.from ? moment($scope.search.from, 'YYYY-MM-DD').format('YYYYMMDD') : null,
				to: $scope.search.to ? moment($scope.search.to, 'YYYY-MM-DD').format('YYYYMMDD')  : null,
				invoiced: $scope.search.invoiced,
				billable: $scope.search.billable
			}, 
			function(tr) {

				$scope.loading = false;
				$scope.searched = true;
				$scope.timeRegistrations = _.sortByAll(tr, ['date.numeric', 'from.numeric']);
			});
		};

		$scope.$watch('includeAllTimeRegistrations', function(v) {
			if($scope.timeRegistrations) {
				_.forEach($scope.timeRegistrations, function(tr) {
					tr.included = v;
				});
			}
		});

		// WIZART STEP 2 (invoice lines)
		// *****************************

		$scope.invoice = { customer: { address: { } } };

		$scope.canGoto2 = function() {
			return _.some($scope.timeRegistrations, { included: true });
		};	

		$scope.gobackto2 = function() {
			activate(2);
		};

		$scope.goto2 = function() {

			$scope.invoice.linkedTimeRegistrationIds = _.map(_.where($scope.timeRegistrations, { included: true }), function(tr) { return tr.id; });
			
			$scope.invoice.lines = _.map(_.groupBy(_.where($scope.timeRegistrations, { included: true }), 
				function(tr) {
					return tr.projectId + '-' + tr.task;
				}),
				function(tr) {
					var totalMinutes = _.reduce(_.map(tr, 'totalMinutes'), function(sum, i) { return sum + i; });
					var quantity = Math.round((totalMinutes / 60) * 100) / 100;
					var project = _.find($scope.projects, 'id',  tr[0].projectId);
					var task = project ? _.find(project.tasks, 'name', tr[0].task) : null;
					var priceInCents = task ? parseInt(task.defaultRateInCents) : 0;

					return {
						description: project.name + ' - ' + task.name,
						quantity: quantity,
						vatPercentage: 21,
						price: priceInCents / 100,
						priceInCents: priceInCents
					};
				}, 0);

			activate(2);
		};

		$scope.removeInvoiceLine = function(invoiceLine) {
			_.remove($scope.invoice.lines, invoiceLine);
		};

		$scope.addInvoiceLine = function() {
			$scope.invoice.lines.push({
				description: '',
				quantity: 1,
				vatPercentage: 21,
				price: 0,
				priceInCents: 0			
			});
		};	

		$scope.$watch('invoice.lines', function(lines) {
			_.forEach(lines, function(line) {
				line.priceInCents = Math.round(line.price * 100);
				line.totalInCents = Math.round(line.quantity * line.priceInCents);
				line.total = line.totalInCents / 100;
			});
		}, true);

		// WIZART STEP 3 (invoice info)
		// ****************************

		$scope.goto3 = function() {

			activate(3);
		};

		$scope.gobackto3 = function() {
			activate(3);
		};

		$scope.$watch('invoice.templateId', function(id) {
			var template = _.find($scope.templates, 'id', id);
			$scope.invoice.template = template ? template.content : '';
		});

		$scope.$watch('invoice.displayDate', function(date) {
			if(date) {
				$scope.invoice.displayCreditTerm = moment(date, 'YYYY-MM-DD').add(30, 'day').format('YYYY-MM-DD');
				$scope.invoice.date = moment(date, 'YYYY-MM-DD').format('YYYYMMDD');
			}
			else { 
				$scope.invoice.displayCreditTerm = null; 
				$scope.invoice.date = null;
			}
		});

		$scope.$watch('invoice.displayCreditTerm', function(date) {
			if(date) {
				$scope.invoice.creditTerm = moment(date, 'YYYY-MM-DD').format('YYYYMMDD');
			}
			else{ 
				$scope.invoice.creditTerm = null;
			}
		});

		$scope.searchCustomer = function() {
			var searchDialog = $modal.open({
				templateUrl: '/modules/crm/views/searchcompany.html',
				controller: 'SearchCompanyDialogController'
			});

			searchDialog.result.then(function (company) {
				if(company) {
					$scope.invoice.customer.name = company.name;
					$scope.invoice.customer.vatNumber = company.vatNumber;
					$scope.invoice.customer.number = company.number;
					$scope.invoice.customer.address.line1 = company.address.line1;
					$scope.invoice.customer.address.line2 = company.address.line2;
					$scope.invoice.customer.address.postalcode = company.address.postalcode;
					$scope.invoice.customer.address.city = company.address.city;
				}
			});	
		};

		// WIZART STEP 4 (preview)
		// ***********************

		$scope.goto4 = function() {

			$scope.loading = true;

			Invoice.preview($scope.invoice, function(invoice) {
				$scope.invoicePreview = invoice;
				$scope.loading = false;
				$scope.previewUrl = $sce.trustAsResourceUrl('/render/#!/invoicepreview?invoice=' + window.encodeURIComponent(JSON.stringify(invoice)));
			});

			activate(4);
		};

		$scope.create = function() {

			Invoice.save($scope.invoice, function() {
				$state.go('app.invoice_overview');
			});
		};
	}

	controller.$inject = ['$scope', '$state', '$stateParams', '$modal', '$sce', 'Project', 'TimeRegistration', 'Template', 'Invoice'];

	angular.module('fmInvoice').controller('CreateInvoiceController', controller);
})();

(function() {
	'use strict';

	function controller($scope, Invoice, $state, $stateParams) {

		$scope.year = moment($stateParams.from, 'YYYYMMDD').year();

		$scope.getAllInvoices = function() {
			Invoice.bydate({ from: $stateParams.from, to:  $stateParams.to }, function(invoices) {
				$scope.invoices = _.sortBy(invoices, function(i) { return i.date.numeric; });
			});
		};

		$scope.previous = function() {
			$state.go('app.invoice_overview', { from: (($scope.year - 1) + '0101'), to: (($scope.year - 1) + '1231') }, { location: 'replace' });
		};

		$scope.next = function() {
			$state.go('app.invoice_overview', { from: (($scope.year + 1) + '0101'), to: (($scope.year + 1) + '1231') }, { location: 'replace' });
		};
	}

	controller.$inject = ['$scope', 'Invoice', '$state', '$stateParams'];

	angular.module('fmInvoice').controller('InvoiceOverviewController', controller);
})();

(function() {
	'use strict';

	function controller($scope, $location, $state, $stateParams, Invoice) {

		$scope.from = moment($stateParams.from, 'YYYYMMDD');
		$scope.to = moment($stateParams.to, 'YYYYMMDD');

		// is this a full year?
		if($scope.from.date() === 1 && $scope.from.month() === 0 &&
			$scope.to.date() === 31 && $scope.to.month() === 11 &&
			$scope.from.year() === $scope.to.year())
		{
			$scope.title = $scope.from.format('YYYY');

			$scope.previousFrom = moment($scope.from).subtract(1, 'year');
			$scope.previousTo = moment($scope.to).subtract(1, 'year');
			$scope.nextFrom = moment($scope.from).add(1, 'year');
			$scope.nextTo = moment($scope.to).add(1, 'year');
		}
		// is this a full month?
		else if($scope.from.date() === 1 && moment($scope.from).endOf('month').date() === $scope.to.date() &&
			$scope.from.month() === $scope.to.month() &&
			$scope.from.year() === $scope.to.year())
		{
			$scope.title = $scope.from.format('MMMM YYYY');

			$scope.previousFrom = moment($scope.from).subtract(1, 'month').startOf('month');
			$scope.previousTo = moment($scope.from).subtract(1, 'month').endOf('month');
			$scope.nextFrom = moment($scope.from).add(1, 'month').startOf('month');
			$scope.nextTo = moment($scope.from).add(1, 'month').endOf('month');
		}
		else {
			$scope.title = $scope.from.format('YYYY-MM-DD') + ' - ' + $scope.to.format('YYYY-MM-DD');
			
			var days = $scope.to.diff($scope.from, 'days') + 1;
			$scope.previousFrom = moment($scope.from).subtract(days, 'days');
			$scope.previousTo = moment($scope.to).subtract(days, 'days');
			$scope.nextFrom = moment($scope.from).add(days, 'days');
			$scope.nextTo = moment($scope.to).add(days, 'days');
		}

		$scope.weekStart = moment().startOf('isoWeek').format('YYYYMMDD');
		$scope.weekEnd = moment().endOf('isoWeek').format('YYYYMMDD');
		$scope.monthStart = moment().startOf('month').format('YYYYMMDD');
		$scope.monthEnd = moment().endOf('month').format('YYYYMMDD');
		$scope.yearStart = moment().startOf('year').format('YYYYMMDD');
		$scope.yearEnd = moment().endOf('year').format('YYYYMMDD');

		$scope.previous = function() {
			$state.go('app.invoice_report', { from: $scope.previousFrom.format('YYYYMMDD'), to: $scope.previousTo.format('YYYYMMDD')}, { location: 'replace' });
		};

		$scope.next = function() {
			$state.go('app.invoice_report', { from: $scope.nextFrom.format('YYYYMMDD'), to: $scope.nextTo.format('YYYYMMDD')}, { location: 'replace' });
		};

		$scope.refresh = function() {

			$scope.loading = true;

			Invoice.getinfoforperiodpercustomer({ from: $scope.from.format('YYYYMMDD'), to:  $scope.to.format('YYYYMMDD') },
				function(result) {

					$scope.infoPerCustomer = result;
					$scope.invoiceGraph = _.map(result, function(r) {
						return { label: r.company.name, data: r.totalWithoutVatInCents / 100 };
					});
					$scope.totalWithoutVatInCents = _.sum(result, 'totalWithoutVatInCents');
					$scope.totalWithoutVat = $scope.totalWithoutVatInCents / 100;
					$scope.hasInvoices = result && result.length > 0;

					$scope.loading = false;
				});
		};
	}

	controller.$inject = ['$scope', '$location', '$state', '$stateParams', 'Invoice'];

	angular.module('fmInvoice').controller('InvoiceReportController', controller);
})();

(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.projects', {
			url: '/projects/overview',
			templateUrl: 'modules/project/views/projects.html',
			controller: 'ProjectsController'
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmProject').config(routeRegistration);
})();

(function() {
	'use strict';

	function controller($scope, Project, Company, toUpdate) {

		$scope.originalProject = toUpdate;
		$scope.newProject = toUpdate === undefined;
		toUpdate = toUpdate || { };
		$scope.project =  { 
			companyId: toUpdate.companyId || '',
			name: toUpdate.name || '',
			description: toUpdate.description || '' 
		};

		$scope.isBusy = false;
		$scope.message = '';
		
		Company.query(function(companies) {

			$scope.companies = _.sortBy(companies, 'name');
		});

		$scope.ok = function () {
			showMessage('Saving project...');

			var id = $scope.newProject ? {} : { id: $scope.originalProject.id };

			Project.save(id, $scope.project,
				function(data) { 
					hideMessage();
					$scope.$close(data);
				},
				function(err) { 
					showMessage('An error occurred...'); 
				});
		};

		$scope.cancel = function () {
			$scope.$dismiss('cancel');
		};

		function showMessage(message) {
			$scope.isBusy = true;
			$scope.message = message;
		}

		function hideMessage() {
			$scope.isBusy = false;
			$scope.message = '';
		}
	}

	controller.$inject = ['$scope', 'Project', 'Company', 'toUpdate'];

	angular.module('fmProject').controller('ProjectDialogController', controller);
})();

(function() {
	'use strict';

	function controller($scope, $modal, Project) {

		$scope.getAllProjects = function() {
			Project.query(function(projects) {
					$scope.projects = _.sortByAll(projects, ['company.name', 'name']);
			});
		};

		$scope.openProject = function(project) {

			var createDialog = $modal.open({
				templateUrl: '/modules/project/views/editproject.html',
				controller: 'ProjectDialogController',
				resolve: {
					toUpdate: function () {
						return project;
					}
				}
			});

			createDialog.result.then(function (project) {
				var p = _.find($scope.projects, { 'id': project.id });
				if(p) angular.copy(project, p);
				else $scope.projects.push(project);
			});		
		};

		$scope.openProjectTasks = function(project) {
			var createDialog = $modal.open({
				templateUrl: '/modules/project/views/projecttasksdialog.html',
				controller: 'ProjectTasksDialogController',
				resolve: {
					toUpdate: function () {
						return project;
					}
				}
			});	

			createDialog.result.then(function (project) {
				var p = _.find($scope.projects, { 'id': project.id });
				if(p) 
					angular.copy(project, p);
			});				
		};

		$scope.hideProject = function(project) {
			Project.hide({ id: project.id }, function() {
				project.hidden = true;
			});
		};

		$scope.unhideProject = function(project) {
			Project.unhide({ id: project.id }, function() {
				project.hidden = false;
			});
		};
	}

	controller.$inject = ['$scope', '$modal', 'Project'];

	angular.module('fmProject').controller('ProjectsController', controller);
})();

(function() {
	'use strict';

	function controller($scope, Project, toUpdate) {

		$scope.originalProject = toUpdate;
		toUpdate = toUpdate || { };
		$scope.project =  { 
			tasks: _.map(toUpdate.tasks, function(t) {
				return {
					name: t.name,
					defaultRateInCents: t.defaultRateInCents,
					defaultRate: t.defaultRateInCents ? (t.defaultRateInCents) / 100 : t.defaultRateInCents
				};
			})
		};

		$scope.$watch('project.tasks', function(tasks) {
			_.forEach(tasks, function(task) {
				task.defaultRateInCents = Math.round(task.defaultRate * 100);
			});
		}, true);
		
		$scope.isBusy = false;
		$scope.message = '';

		$scope.ok = function () {
			showMessage('Saving project...');

			Project.changetasks({ id: $scope.originalProject.id }, $scope.project.tasks,
				function(data) { 
					hideMessage();
					$scope.$close(data);
				},
				function(err) { 
					showMessage('An error occurred...'); 
				});
		};

		$scope.cancel = function () {
			$scope.$dismiss('cancel');
		};

		function showMessage(message) {
			$scope.isBusy = true;
			$scope.message = message;
		}

		function hideMessage() {
			$scope.isBusy = false;
			$scope.message = '';
		}
	}

	controller.$inject = ['$scope', 'Project', 'toUpdate'];

	angular.module('fmProject').controller('ProjectTasksDialogController', controller);
})();

(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.settings_templates', {
			url: '/settings/templates',
			templateUrl: 'modules/settings/views/templates.html',
			controller: 'TemplatesController'
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmSettings').config(routeRegistration);
})();

(function() {
	'use strict';

	function controller($scope, Template) {

		$scope.getAllTemplates = function() {
			$scope.templates = Template.query();
		};

		$scope.openTemplate = function(template) {
			$scope.template = template || {};
			$scope.newTemplate = template === undefined;
		};

		$scope.template = {};
		$scope.newTemplate = true;

		$scope.saveTemplate = function() {
			
			var id = $scope.newTemplate ? {} : { id: $scope.template.id };

			Template.save(id, $scope.template,
				function(data) { 
					if($scope.newTemplate) {
						$scope.templates.push(data);
						$scope.template = data;
						$scope.newTemplate = false;
					}
				},
				function(err) { 
					// TODO show toaster
					alert(err);
				});
		};
	}

	controller.$inject = ['$scope', 'Template'];

	angular.module('fmSettings').controller('TemplatesController', controller);
})();

(function() {
	'use strict';
	
	function routeRegistration($stateProvider) {
		$stateProvider

		.state('app.time_overview', {
			url: '/time/overview/:date',
			templateUrl: 'modules/time/views/overview.html',
			controller: 'TimeRegistrationOverviewController',
			params: {
				date: function() { return moment().format('YYYYMMDD'); }
			}
		})

		.state('app.time_report', {
			url: '/time/report/:from/:to',
			templateUrl: 'modules/time/views/report.html',
			controller: 'TimeRegistrationReportController',
			resolve: fm.vendor.resolve('flot', 'flot-plugins'),
			params: {
				from: function() { return moment().startOf('month').format('YYYYMMDD'); },
				to: function() { return moment().endOf('month').format('YYYYMMDD'); }
			}
		})

		.state('app.time_import', {
			url: '/time/import',
			templateUrl: 'modules/time/views/import.html',
			controller: 'TimeRegistrationImportController',
			resolve: fm.vendor.resolve('xlsx')
		})

		.state('app.time_export', {
			url: '/time/export/:from/:to',
			templateUrl: 'modules/time/views/export.html',
			controller: 'TimeRegistrationExportController',
			params: {
				from: function() { return moment().startOf('month').format('YYYYMMDD'); },
				to: function() { return moment().endOf('month').format('YYYYMMDD'); }
			}
		});
	}

	routeRegistration.$inject = ['$stateProvider'];

	angular.module('fmTime').config(routeRegistration);
})();

(function() {
	'use strict';

	function controller($scope, $state, $stateParams, TimeRegistration) {

		$scope.from = moment($stateParams.from, 'YYYYMMDD');
		$scope.to = moment($stateParams.to, 'YYYYMMDD');

		$scope.hasTimeRegistrations = false;	
		$scope.loading = false;

		$scope.from = moment($stateParams.from, 'YYYYMMDD');
		$scope.to = moment($stateParams.to, 'YYYYMMDD');

		$scope.thisWeek = moment().day(1).format('YYYYMMDD') + '/' + moment().day(7).format('YYYYMMDD');
		$scope.lastWeek = moment().day(1).subtract(7, 'days').format('YYYYMMDD') + '/' + moment().day(7).subtract(7, 'days').format('YYYYMMDD');

		$scope.thisMonth = moment().set('date', 1).format('YYYYMMDD') + '/' + moment().set('date', moment().daysInMonth()).format('YYYYMMDD');
		$scope.lastMonth = moment().set('date', 1).subtract(1, 'months').format('YYYYMMDD') + '/' + moment().subtract(1, 'months').set('date', moment().subtract(1, 'months').daysInMonth()).format('YYYYMMDD');

		$scope.thisYear = moment().set('month', 0).set('date', 1).format('YYYYMMDD') + '/' + moment().set('month', 11).set('date', 31).format('YYYYMMDD');
		$scope.lastYear = moment().set('month', 0).set('date', 1).subtract(1, 'years').format('YYYYMMDD') + '/' + moment().set('month', 11).set('date', 31).subtract(1, 'years').format('YYYYMMDD');
		
		$scope.$watch('from', function() {
			$scope.displayFrom = $scope.from.format('YYYY-MM-DD');
		});

		$scope.$watch('to', function() {
			$scope.displayTo = $scope.to.format('YYYY-MM-DD');
		});	

		$scope.changeFrom = function(date, format) {
			$scope.from = moment(date, format);
		};

		$scope.changeTo = function(date, format) {
			$scope.to = moment(date, format);
		};

		$scope.applyDate = function() {
			$state.go('app.time_export', { from: $scope.from.format('YYYYMMDD'), to: $scope.to.format('YYYYMMDD') }, { location: 'replace' });
		};

		$scope.refresh = function() {

			$scope.loading = true;

			TimeRegistration.byrange({ from: $scope.from.format('YYYYMMDD'), to:  $scope.to.format('YYYYMMDD') }, function(tr) {

				 var grouped = _.groupBy(tr, function (i) { return i.date.numeric; });
				 $scope.timeRegistrations = _.sortBy(_.map(grouped, function (g) {
						return {
							date: _.first(g).date,
							items: _.sortBy(g, function(i) { return i.from.numeric; })
						};
					}),
				 function(i) {
				 	return i.date.numeric;
				 });

				$scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
				$scope.loading = false;
			});
		};

		// TODO
		// $scope.export = function() {

		// 	var wb = new Workbook();
		// 	var wbOutput = XLSX.write(wb, { bookType:'xlsx', bookSST:false, type: 'binary' });

		// 	saveAs(new Blob([convertStringToArrayBuffer(wbOutput)],{ type:"application/octet-stream" }), "test.xlsx")
		// }

		// function convertStringToArrayBuffer(s) {
		// 	var buf = new ArrayBuffer(s.length);
		// 	var view = new Uint8Array(buf);
		// 	for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
		// 	return buf;
		// }
	}

	controller.$inject = ['$scope', '$state', '$stateParams', 'TimeRegistration'];

	angular.module('fmTime').controller('TimeRegistrationExportController', controller);
})();

(function() {
	'use strict';

	function controller($scope, $state, XLSXReader, NgTableParams, $filter, Project, TimeRegistration) {

		// Wizard helpers
		// **************
		var steps;

		function createsteps(q) {
			steps = [];
			for(var i = 1; i <= q; i++) steps[i] = false;
		}

		function activate(step) {
			for(var i in steps) {
				steps[i] = false;
			}
			steps[step] = true;
		}

		function isvalid(value) {
			return value !== undefined && value !== null;
		}

		$scope.init = function() {
			createsteps(6);
			activate(1);
		};

		$scope.active = function(step) {
			return !!steps[step];
		};

		// Preload data
		// ************
		Project.active(function(projects) {
			var tasks = [];
			var id = 0;
			_.forEach(projects, function(p) {
				_.forEach(p.tasks, function(t) {
					tasks.push({
						project: p,
						company: p.company,
						task: t,
						display: p.company.name + ' - ' + p.name + ' - ' + t.name,
						id: id++
					});
				});
			});
			$scope.tasks = _.sortBy(tasks, 'display');
		});

		// step 1 (file selection)
		// ***********************

		$scope.fileChanged = function(files) {

			$scope.excel.sheets = [];
			$scope.excelFile = files[0];

			XLSXReader.readFile($scope.excelFile, false).then(function(xlsxData) {
				$scope.excel.sheets = xlsxData;
				activate(2);
			});
		};

		// step 2 (sheet selection)
		// ***********************

		$scope.excel = {};
		$scope.excel.selectedSheetName = undefined;
		$scope.excel.selectedSheet = undefined;

		$scope.goto3 = function() {
			
			$scope.excel.selectedSheet = $scope.excel.sheets[$scope.excel.selectedSheetName];

			var selectedSheetHeader = [];
			for(var i = 0; i < $scope.excel.selectedSheet.header.length; i++) {
				selectedSheetHeader.push({ key: i, value: $scope.excel.selectedSheet.header[i] });
			}
			$scope.excel.selectedSheetHeader = selectedSheetHeader;

			activate(3);
		};

		$scope.canGoto3 = function() {
			return isvalid($scope.excel.selectedSheetName);
		};

		// step 3 (column selection)
		// ***********************	

		$scope.goto4 = function() {

			$scope.excel.groupedRows = _.groupBy($scope.excel.selectedSheet.data, function(r) {
				return r[$scope.excel.selectedProjectColumn] + ' - ' + r[$scope.excel.selectedTaskColumn];
			});

			$scope.excel.projectsInSheet = _.map($scope.excel.groupedRows, function(g) {
				return {
					project: g[0][$scope.excel.selectedProjectColumn],
					task: g[0][$scope.excel.selectedTaskColumn],
					display: g[0][$scope.excel.selectedProjectColumn] + ' - ' + g[0][$scope.excel.selectedTaskColumn]
				};
			});

			activate(4);
		};

		$scope.canGoto4 = function() {
			return isvalid($scope.excel.selectedProjectColumn) &&
				isvalid($scope.excel.selectedTaskColumn) && 
				isvalid($scope.excel.selectedDateColumn) &&
				isvalid($scope.excel.selectedFromColumn) && 
				isvalid($scope.excel.selectedToColumn) && 
				isvalid($scope.excel.selectedDescriptionColumn);
		};

		// step 4 (project mapping)
		// ***********************	

		$scope.goto5 = function() {
			activate(5);
		};

		$scope.canGoto5 = function() {
			return _.every($scope.excel.projectsInSheet, function(p) {
				return isvalid(p.mappedProjectAndTask);
			});
		};

		// step 5 (saving)
		// ***********************	

		$scope.importing = false;

		$scope.import = function() {

			var registrations = [];
			$scope.importing = true;

			_.forEach($scope.excel.groupedRows, function(groupedRow) {

				var selectedProjectTask = _.find($scope.excel.projectsInSheet, function(p) {
					return p.project === groupedRow[0][$scope.excel.selectedProjectColumn] && p.task === groupedRow[0][$scope.excel.selectedTaskColumn];
				}).mappedProjectAndTask;

				var project = _.find($scope.tasks, { id: selectedProjectTask }).project;
				var task = _.find($scope.tasks, { id: selectedProjectTask }).task;

				_.forEach(groupedRow, function(row) {

					registrations.push({
						companyId: project.companyId,
						projectId: project.id,
						task: task.name,
						description: row[$scope.excel.selectedDescriptionColumn],
						date: convertDisplayDateToNumeric(row[$scope.excel.selectedDateColumn]),
						from: convertDisplayTimeToNumeric(row[$scope.excel.selectedFromColumn]),
						to: convertDisplayTimeToNumeric(row[$scope.excel.selectedToColumn]),
						billable: task.billable
					});
				});
			});

			TimeRegistration.saveMultiple(registrations, function(data) {
				$scope.importing = false;
				$scope.timeRegistrationsImported = data;
				$scope.summaryTableParams.count(10); // the number of items to show per page
				activate(6);
			}, function(err) {
				$scope.importing = false;
			});
		};
		
		function convertDisplayDateToNumeric(date) {
			return parseInt(date.replace(/-/g, ''), 10);
		}

		function convertDisplayTimeToNumeric(time) {
			return parseInt(time.replace(':', ''), 10);
		}



		// step 6 (summary)
		// ***********************	


		$scope.filterImportedTimeRegistrations = function ($defer, params) {

			if(!$scope.timeRegistrationsImported)
				return;

			// use build-in angular filter
			var filteredData = params.filter() ? $filter('filter')($scope.timeRegistrationsImported, params.filter()) : $scope.timeRegistrationsImported;
			var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

			params.total(orderedData.length); // set total for recalc pagination
			$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
		};

		$scope.summaryTableParams = new NgTableParams({
			page: 1,
			count: 1
		}, 
		{
			getData: $scope.filterImportedTimeRegistrations
		});
	}

	controller.$inject = ['$scope', '$state', 'XLSXReader', 'NgTableParams', '$filter', 'Project', 'TimeRegistration'];

	angular.module('fmTime').controller('TimeRegistrationImportController', controller);
})();

(function() {
	'use strict';

	function controller($scope, $modal, $location, $state, $stateParams, TimeRegistration) {

		$scope.date = moment($stateParams.date, 'YYYYMMDD');
		$scope.hasTimeRegistrations = false;

		$scope.$watch('date', function() {
			$scope.displayDate = $scope.date.format('YYYY-MM-DD');
		});

		$scope.nextDate = function() {
			$state.go('app.time_overview', { date: moment($scope.date.add(1, 'days')).format('YYYYMMDD') }, { location: 'replace' });
		};

		$scope.previousDate = function() {
			$state.go('app.time_overview', { date: $scope.date.subtract(1, 'days').format('YYYYMMDD') }, { location: 'replace' });
		};

		$scope.changeDate = function(date, format) {
			$state.go('app.time_overview', { date: moment(date, format).format('YYYYMMDD') }, { location: 'replace' });
		};

		$scope.refresh = function() {
			TimeRegistration.bydate({ date: $scope.date.format('YYYYMMDD') }, function(timeRegistrations) {
				$scope.hasTimeRegistrations = timeRegistrations.length > 0;
				$scope.timeRegistrations = _.sortBy(timeRegistrations,
					function(i) {
						return i.from.numeric;
					});
			});
		};

		$scope.openTimeRegistration = function(timeRegistration) {

			var createDialog = $modal.open({
				templateUrl: '/modules/time/views/timeregistrationdialog.html',
				controller: 'TimeRegistrationDialogController',
				size: 'lg',
				resolve: {
					toUpdate: function () {
						return timeRegistration;
					},
					date: function() {
						return $scope.date.format('YYYYMMDD');
					}
				}
			});

			createDialog.result.then(function (data) {
				if(data.deleted) {
					_.remove($scope.timeRegistrations, function(item) { return item.id === data.deleted; });
				}
				else {
					var c = _.find($scope.timeRegistrations, { 'id': data.id });
					if(c) angular.copy(data, c);
					else $scope.timeRegistrations.push(data);
				}

				$scope.hasTimeRegistrations = $scope.timeRegistrations.length > 0;
			});		
		};
	}

	controller.$inject = ['$scope', '$modal', '$location', '$state', '$stateParams', 'TimeRegistration'];

	angular.module('fmTime').controller('TimeRegistrationOverviewController', controller);
})();

(function() {
	'use strict';

	function controller($scope, $location, $state, $stateParams, TimeRegistration) {

		$scope.from = moment($stateParams.from, 'YYYYMMDD');
		$scope.to = moment($stateParams.to, 'YYYYMMDD');

		// is this a full year?
		if($scope.from.date() === 1 && $scope.from.month() === 0 &&
			$scope.to.date() === 31 && $scope.to.month() === 11 &&
			$scope.from.year() === $scope.to.year())
		{
			$scope.title = $scope.from.format('YYYY');

			$scope.previousFrom = moment($scope.from).subtract(1, 'year');
			$scope.previousTo = moment($scope.to).subtract(1, 'year');
			$scope.nextFrom = moment($scope.from).add(1, 'year');
			$scope.nextTo = moment($scope.to).add(1, 'year');
		}
		// is this a full month?
		else if($scope.from.date() === 1 && moment($scope.from).endOf('month').date() === $scope.to.date() &&
			$scope.from.month() === $scope.to.month() &&
			$scope.from.year() === $scope.to.year())
		{
			$scope.title = $scope.from.format('MMMM YYYY');

			$scope.previousFrom = moment($scope.from).subtract(1, 'month').startOf('month');
			$scope.previousTo = moment($scope.from).subtract(1, 'month').endOf('month');
			$scope.nextFrom = moment($scope.from).add(1, 'month').startOf('month');
			$scope.nextTo = moment($scope.from).add(1, 'month').endOf('month');
		}
		else {
			$scope.title = $scope.from.format('YYYY-MM-DD') + ' - ' + $scope.to.format('YYYY-MM-DD');
			
			var days = $scope.to.diff($scope.from, 'days') + 1;
			$scope.previousFrom = moment($scope.from).subtract(days, 'days');
			$scope.previousTo = moment($scope.to).subtract(days, 'days');
			$scope.nextFrom = moment($scope.from).add(days, 'days');
			$scope.nextTo = moment($scope.to).add(days, 'days');
		}

		$scope.weekStart = moment().startOf('isoWeek').format('YYYYMMDD');
		$scope.weekEnd = moment().endOf('isoWeek').format('YYYYMMDD');
		$scope.monthStart = moment().startOf('month').format('YYYYMMDD');
		$scope.monthEnd = moment().endOf('month').format('YYYYMMDD');
		$scope.yearStart = moment().startOf('year').format('YYYYMMDD');
		$scope.yearEnd = moment().endOf('year').format('YYYYMMDD');

		$scope.previous = function() {
			$state.go('app.time_report', { from: $scope.previousFrom.format('YYYYMMDD'), to: $scope.previousTo.format('YYYYMMDD')}, { location: 'replace' });
		};

		$scope.next = function() {
			$state.go('app.time_report', { from: $scope.nextFrom.format('YYYYMMDD'), to: $scope.nextTo.format('YYYYMMDD')}, { location: 'replace' });
		};

		$scope.refresh = function() {

			$scope.loading = true;

			TimeRegistration.getinfoforperiod({ from: $scope.from.format('YYYYMMDD'), to:  $scope.to.format('YYYYMMDD') },
				function(result) {
					$scope.summary = result;
									
					$scope.billableUnbillableGraph = [
						{ label: 'Billable', data: $scope.summary.billableMinutes, color: '#7266BA' },
						{ label: 'Unbillable', data: $scope.summary.unBillableMinutes, color: '#5D9CEC' }
					];
					
					if($scope.summary.unBillableMinutes || $scope.summary.billableMinutes)
						$scope.hasHours = true;
					else $scope.hasHours = false;

					$scope.loading = false;
				});

			TimeRegistration.getinfoforperiodpertask({ from: $scope.from.format('YYYYMMDD'), to:  $scope.to.format('YYYYMMDD') },
				function(result) {
					var grouped = _.groupBy(result, function(i) { 
						return JSON.stringify({ 
							c: i.companyId,
							p: i.projectId
						});
					});

					$scope.infoPerProject = _.sortBy(_.map(grouped, function (g) {
						return {
							companyId: g[0].companyId,
							company: g[0].company,
							projectId: g[0].projectId,
							project: g[0].project,
							tasks: g
						};
					}), function (i) { return i.company.name + i.project.name; });
				});
		};
	}

	controller.$inject = ['$scope', '$location', '$state', '$stateParams', 'TimeRegistration'];

	angular.module('fmTime').controller('TimeRegistrationReportController', controller);
})();

(function() {
	'use strict';

	function controller($scope, Project, TimeRegistration, toUpdate, date) {

		// private methods
		// ---------------

		function convertNumericTimeToDisplay(time) {
			var hour = Math.floor(time / 100);
			var minutes = Math.floor(time - (hour * 100));
			return ('00' + hour).slice(-2) + ':' + ('00' + minutes).slice(-2);
		}

		function showMessage(message) {
			$scope.isBusy = true;
			$scope.message = message;
		}

		function hideMessage() {
			$scope.isBusy = false;
			$scope.message = '';
		}

		function convertDisplayTimeToNumeric(time) {
			return parseInt(time.replace(':', ''), 10);
		}

		// scope watches
		// -------------

		$scope.$watch('timeRegistration.company', function (newv, oldv) {
			if(oldv && newv && oldv.id !== newv.id) {
				$scope.timeRegistration.project = null;
				$scope.timeRegistration.task = null;
			}
		});

		$scope.$watch('timeRegistration.project', function (newv, oldv) {
			if(oldv && newv && oldv.id !== newv.id) {
				$scope.timeRegistration.task = null;	
			}
		});

		$scope.$watch('timeRegistration.task', function () {
			if($scope.newTimeRegistration && $scope.timeRegistration.task) {
				$scope.timeRegistration.billable = $scope.timeRegistration.task.defaultRateInCents > 0;
			}
		});	

		// scope properties
		// ----------------	

		$scope.isBusy = false;
		$scope.message = '';

		$scope.originalTimeRegistration = toUpdate;
		$scope.newTimeRegistration = toUpdate === undefined;
		toUpdate = toUpdate || { };
		$scope.timeRegistration =  { 
			company: null,
			project: null,
			task: null,
			billable: toUpdate.billable || false,
			description: toUpdate.description || '',
			from: toUpdate.from ? convertNumericTimeToDisplay(toUpdate.from.numeric) : '',
			to: toUpdate.to ? convertNumericTimeToDisplay(toUpdate.to.numeric) : '',
		};	
		
		// load all projects and convert them to companies => projects => tasks
		$scope.projects = Project.active(function() {

			$scope.companies = _.sortBy(_.map(
				_.groupBy($scope.projects, function(p) { return p.companyId; }),
				function(g) { 
					return { 
						id: g[0].companyId, 
						name: g[0].company.name,
						projects: _.sortBy(g, 'name')
					}; 
				}), 'name');	

			if(toUpdate.companyId)
				$scope.timeRegistration.company = _.find($scope.companies, { id: toUpdate.companyId });
			
			if(toUpdate.projectId && $scope.timeRegistration.company)
				$scope.timeRegistration.project = _.find($scope.timeRegistration.company.projects, { id: toUpdate.projectId });

			if(toUpdate.task && $scope.timeRegistration.project)
				$scope.timeRegistration.task = _.find($scope.timeRegistration.project.tasks, { name: toUpdate.task });

			if($scope.newTimeRegistration)
				$scope.projectEditable = true;
			else if($scope.timeRegistration.task)
				$scope.projectEditable = true;
			else $scope.projectEditable = false;
		});

		// scope actions
		// -------------

		$scope.ok = function () {
			showMessage('Saving time registration...');

			var id = $scope.newTimeRegistration ? {} : { id: $scope.originalTimeRegistration.id };

			TimeRegistration.save(id, 
			{
				companyId: $scope.timeRegistration.company.id,
				projectId: $scope.timeRegistration.project.id,
				task: $scope.timeRegistration.task.name,
				description: $scope.timeRegistration.description,
				billable: $scope.timeRegistration.billable,
				date: date,
				from: convertDisplayTimeToNumeric($scope.timeRegistration.from),
				to: convertDisplayTimeToNumeric($scope.timeRegistration.to)
			},
			function(data) { 
				hideMessage();
				$scope.$close(data);
			},
			function(err) { 
				showMessage('An error occurred...'); 
			});
		};

		$scope.delete = function() {
			showMessage('Deleting time registration...');

			var id = $scope.newTimeRegistration ? {} : { id: $scope.originalTimeRegistration.id };

			TimeRegistration.delete({ id: $scope.originalTimeRegistration.id },
			function(data) {
				hideMessage();
				$scope.$close(data);
			},
			function(err) { 
				showMessage('An error occurred...'); 
			});		
		};

		$scope.cancel = function () {
			$scope.$dismiss('cancel');
		};
	}

	controller.$inject = ['$scope', 'Project', 'TimeRegistration', 'toUpdate', 'date'];

	angular.module('fmTime').controller('TimeRegistrationDialogController', controller);
})();

//# sourceMappingURL=application.js.map