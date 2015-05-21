// TODO unit test
angular.module('core').controller('SidebarController', ['$rootScope', '$scope', '$state', '$location', '$http', '$timeout', 'const_mediaquery',
function($rootScope, $scope, $state, $location, $http, $timeout, mq){
	'use strict';
	
	var $win = $(window);
	var $html = $('html');
	var $body = $('body');

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

	function isActive(item) {

		if(!item) return;

		if( !item.sref || item.sref === '#') {
			var foundActive = false;
			angular.forEach(item.submenu, function(value, key) {
				if(isActive(value)) foundActive = true;
			});
			return foundActive;
		}
		else return $state.is(item.sref) || $state.includes(item.sref);
	};

	function loadSidebarMenu() {

		var menuJson = 'settings/sidebar-menu.json',
			menuURL  = menuJson + '?v=' + (new Date().getTime()); // jumps cache

		$http.get(menuURL).success(function(items) {
				$rootScope.menuItems = items;
			})
			.error(function(data, status, headers, config) {
				alert('Failure loading menu');
			});
	};

	loadSidebarMenu();

	$scope.getMenuItemPropClasses = function(item) {
		return (item.heading ? 'header' : '') +
			(isActive(item) ? ' active' : '') + 
			(item.open ? ' open' : '') + 
			((item.submenu && item.submenu.length > 0) ? ' has-sub-menu' : '');
	};

	$scope.onMenuItemClick = function(item) {
		item.open = item.open ? false : true;
	};
}]);