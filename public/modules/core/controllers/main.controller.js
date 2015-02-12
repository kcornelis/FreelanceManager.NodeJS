// TODO unit test
// From the angle project
angular.module('core').controller('AppController', ['$rootScope', '$scope', '$state', '$window', '$localStorage', '$timeout', 'toggleStateService', 'cfpLoadingBar',
function($rootScope, $scope, $state, $window, $localStorage, $timeout, toggle, cfpLoadingBar) {
	'use strict';

	// Loading bar transition
	// ----------------------------------- 
	$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
		if($('.wrapper > section').length)
			cfpLoadingBar.start();
	});
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
		event.targetScope.$watch('$viewContentLoaded', function () {
			cfpLoadingBar.complete();
		});
	});

	// Hook not found
	$rootScope.$on('$stateNotFound',
		function(event, unfoundState, fromState, fromParams) {
				console.log(unfoundState.to); // 'lazy.state'
				console.log(unfoundState.toParams); // {a:1, b:2}
				console.log(unfoundState.options); // {inherit:false} + default options
		});

	// Hook error
	$rootScope.$on('$stateChangeError',
		function(event, toState, toParams, fromState, fromParams, error){
			console.log(error);
		});

	// Hook success
	$rootScope.$on('$stateChangeSuccess',
		function(event, toState, toParams, fromState, fromParams) {
			// display new view from top
			$window.scrollTo(0, 0);
			// Save the route title
			$rootScope.currTitle = $state.current.title;
		});

	$rootScope.currTitle = $state.current.title;
	$rootScope.pageTitle = function() {
		return $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
	};

	// iPad may presents ghost click issues
	// if( ! browser.ipad )
		// FastClick.attach(document.body);

	// Close submenu when sidebar change from collapsed to normal
	$rootScope.$watch('app.layout.isCollapsed', function(newValue, oldValue) {
		if( newValue === false )
			$rootScope.$broadcast('closeSidebarMenu');
	});

	// Restore layout settings
	if(angular.isDefined($localStorage.layout))
		$scope.app.layout = $localStorage.layout;
	else
		$localStorage.layout = $scope.app.layout;

	$rootScope.$watch('app.layout', function () {
		$localStorage.layout = $scope.app.layout;
	}, true);

	// Hides/show user avatar on sidebar
	$scope.toggleUserBlock = function(){
		$scope.$broadcast('toggleUserBlock');
	};

	// Restore application classes state
	toggle.restoreState($(document.body));

	// Applies animation to main view for the next pages to load
	$timeout(function(){
		$rootScope.mainViewAnimation = $rootScope.app.viewAnimation;
	});

	// cancel click event easily
	$rootScope.cancel = function($event) {
		$event.stopPropagation();
	};
}]);
