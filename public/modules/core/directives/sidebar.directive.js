// TODO unit test
// From the angle project
angular.module('core').directive('sidebar', ['$window', 'const_mediaquery', function($window, mq) {
	'use strict';

	var $win  = $($window);
	var $html = $('html');
	var $body = $('body');
	var $scope;
	var $sidebar;

	// Open the collapse sidebar submenu items when on touch devices 
	// - desktop only opens on hover
	function toggleTouchItem($element){
		$element
			.siblings('li')
			.removeClass('open')
			.end()
			.toggleClass('open');
	}

	// Handles hover to open items under collapsed menu
	// ----------------------------------- 
	function toggleMenuItem($listItem) {

		removeFloatingNav();

		var ul = $listItem.children('ul');
		
		if( !ul.length ) return $();
		if( $listItem.hasClass('open') ) {
			toggleTouchItem($listItem);
			return $();
		}

		var $aside = $('.aside');
		var mar =  $scope.app.layout.isFixed ?  parseInt( $aside.css('padding-top'), 0) : 0;

		var subNav = ul.clone().appendTo( $aside );
		
		toggleTouchItem($listItem);

		var itemTop = ($listItem.position().top + mar) - $sidebar.scrollTop();
		var vwHeight = $win.height();

		subNav
			.addClass('nav-floating')
			.css({
				position: $scope.app.layout.isFixed ? 'fixed' : 'absolute',
				top:      itemTop,
				bottom:   (subNav.outerHeight(true) + itemTop > vwHeight) ? 0 : 'auto'
			});

		subNav.on('mouseleave', function() {
			toggleTouchItem($listItem);
			subNav.remove();
		});

		return subNav;
	}

	function removeFloatingNav() {
		$('.sidebar-subnav.nav-floating').remove();
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
	function isMobile() {
		return $win.width() < mq.tablet;
	}	

	return {
		restrict: 'EA',
		template: '<nav class="sidebar" ng-transclude></nav>',
		transclude: true,
		replace: true,
		link: function(scope, element, attrs) {
			
			$scope   = scope;
			$sidebar = element;

			var eventName = isTouch() ? 'click' : 'mouseenter' ;
			var subNav = $();
			$sidebar.on( eventName, '.nav > li', function() {

				if( isSidebarCollapsed() && !isMobile() ) {

					subNav.trigger('mouseleave');
					subNav = toggleMenuItem( $(this) );

				}

			});

			scope.$on('closeSidebarMenu', function() {
				removeFloatingNav();
				$('.sidebar li.open').removeClass('open');
			});
		}
	};
}]);