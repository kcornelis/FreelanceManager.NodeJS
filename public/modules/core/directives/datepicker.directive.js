// TODO unit test this directive
angular.module('core').directive('fmDatepicker', 
function ($timeout) {
	'use strict';
	
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
				orientation: "auto " + position,
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
});