// Todo unit test
angular.module('core').directive('fmAddErrorFor', function() {
	'use strict';

	return {
		link: function(scope, element, attrs) {
			
			scope.$watch(attrs.fmAddErrorFor, function(formValue){
				scope.$watch(attrs.fmAddErrorFor + '.$invalid', function(){
					if(formValue.$touched && formValue.$invalid && !formValue.$pristine)
						element.addClass('has-error');
					else element.removeClass('has-error');
				});
				scope.$watch(attrs.fmAddErrorFor + '.$touched', function(){
					if(formValue.$touched && formValue.$invalid && !formValue.$pristine)
						element.addClass('has-error');
					else element.removeClass('has-error');
				});				
			});
		}
	};
});