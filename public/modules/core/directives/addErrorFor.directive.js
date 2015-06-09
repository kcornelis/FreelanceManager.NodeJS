// TODO unit test
(function() {
	'use strict';
	
	function addErrorForDirective() {
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
	}

	addErrorForDirective.$inject = [];

	angular.module('core').directive('fmAddErrorFor', addErrorForDirective);
})();
