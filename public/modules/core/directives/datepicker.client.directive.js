'use strict';

// TODO unit test this directive

angular.module('core').directive('fmDatepicker', function ($timeout) {
	return {
		restrict: 'A',
		require: '?ngModel',
		scope: {
			fmDatepickerDatechanged: '&'
		},
		link: function(scope, element, attrs, ngModel, timeout) {
			if (!ngModel) 
				return; 

			var updateModel = function(dateTxt) {
				scope.$apply(function () {
					ngModel.$setViewValue(dateTxt);
				}); 
			};

			var shouldupdateModel = true;

			ngModel.$render = function() {
				shouldupdateModel = false;
				element.datepicker('setDate', ngModel.$viewValue || '');
				shouldupdateModel = true;
			};

			element.datepicker({
				format: attrs.fmDatepickerFormat || 'yyyy-mm-dd'
			})
			.on('changeDate', function(date) { 

				var dateTxt = date.format(attrs.fmDatepickerFormat || 'yyyy-mm-dd');
				
				if(shouldupdateModel){

					element.datepicker('remove');

					updateModel(dateTxt);
				
					if (scope.fmDatepickerDatechanged) {
						
						scope.$apply(function() { 
							scope.fmDatepickerDatechanged({date: dateTxt});
						}); 
					
					}
				}
			});
		  }
	};
});