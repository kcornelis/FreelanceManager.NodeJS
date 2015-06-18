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
