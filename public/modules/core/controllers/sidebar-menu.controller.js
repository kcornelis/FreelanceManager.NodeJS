// TODO unit test
// From the angle project
angular.module('core').controller('SidebarController', ['$rootScope', '$scope', '$state', '$location', '$http', '$timeout', 'const_mediaquery',
function($rootScope, $scope, $state, $location, $http, $timeout, mq){
	'use strict';
	
	var currentState = $rootScope.$state.current.name;
	var $win = $(window);
	var $html = $('html');
	var $body = $('body');

	// Adjustment on route changes
	$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
		currentState = toState.name;
		// Hide sidebar automatically on mobile
		$('body.aside-toggled').removeClass('aside-toggled');

		$rootScope.$broadcast('closeSidebarMenu');
	});

	// Normalize state on resize to avoid multiple checks
	$win.on('resize', function() {
		if( isMobile() )
			$body.removeClass('aside-collapsed');
		else
			$body.removeClass('aside-toggled');
	});

	// Check item and children active state
	var isActive = function(item) {

		if(!item) return;

		if( !item.sref || item.sref === '#') {
			var foundActive = false;
			angular.forEach(item.submenu, function(value, key) {
				if(isActive(value)) foundActive = true;
			});
			return foundActive;
		}
		else
			return $state.is(item.sref) || $state.includes(item.sref);
	};

	// Load menu from json file
	// ----------------------------------- 
	
	$scope.getMenuItemPropClasses = function(item) {
		return (item.heading ? 'nav-heading' : '') +
			(isActive(item) ? ' active' : '') ;
	};

	$scope.loadSidebarMenu = function() {

		var menuJson = 'settings/sidebar-menu.json',
			menuURL  = menuJson + '?v=' + (new Date().getTime()); // jumps cache

		$http.get(menuURL).success(function(items) {
				$rootScope.menuItems = items;
			})
			.error(function(data, status, headers, config) {
				alert('Failure loading menu');
			});
	 };

	 $scope.loadSidebarMenu();

	// Handle sidebar collapse items
	// ----------------------------------- 
	var collapseList = [];

	$scope.addCollapse = function($index, item) {
		collapseList[$index] = !isActive(item);
	};

	$scope.isCollapse = function($index) {
		return (collapseList[$index]);
	};

	$scope.toggleCollapse = function($index, isParentItem) {

		// collapsed sidebar doesn't toggle drodopwn
		if( isSidebarCollapsed() && !isMobile() ) return true;

		// make sure the item index exists
		if( angular.isDefined( collapseList[$index] ) ) {
			collapseList[$index] = !collapseList[$index];
			closeAllBut($index);
		}
		else if ( isParentItem ) {
			closeAllBut(-1);
		}
	
		return true;
	};

	function closeAllBut(index) {
		index += '';
		for(var i in collapseList) {
			if(index < 0 || index.indexOf(i) < 0)
				collapseList[i] = true;
		}
	}

	// Helper checks
	// ----------------------------------- 

	function isMobile() {
		return $win.width() < mq.tablet;
	}
	function isTouch() {
		return $html.hasClass('touch');
	}
	function isSidebarCollapsed() {
		return $body.hasClass('aside-collapsed');
	}
	function isSidebarToggled() {
		return $body.hasClass('aside-toggled');
	}
}]);
