// TODO unit test
angular.module('core').directive('href', function() {
	'use strict';
	
	return {
		restrict: 'A',
		compile: function(element, attr) {
				return function(scope, element) {
					if(attr.ngClick || attr.href === '' || attr.href === '#'){
						if( !element.hasClass('dropdown-toggle') )
							element.on('click', function(e){
								e.preventDefault();
								e.stopPropagation();
							});
					}
				};
			}
	 };
});