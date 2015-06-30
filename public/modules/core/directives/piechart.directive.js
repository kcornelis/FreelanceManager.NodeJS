// TODO unit test
// TODO use open source directive (for flot)
(function() {
	'use strict';

	function piechartDirective() {

		return{
			restrict: 'E',
			link: function(scope, elem, attrs) {

				
				var chart = null,
					options = {
					series: {
						pie: {
							show: true,
							radius: 1,
							label: {
								show: true,
								radius: 2/3,
								formatter: function (label, series) {
									return '<div style="font-size:8pt; text-align:center; padding:2px; color:white;">' + label + '<br/>' + Math.round(series.percent) + '%</div>';
								},
								threshold: 0.1
							}
						}
					},
					legend: {
						show: false
					}
				};

				scope.$watch(attrs.ngModel, function(v) {

					if(!chart) {

						if(v) {
							chart = $.plot(elem, v , options);
							elem.show();
						}
					}else{
						chart.setData(v);
						chart.setupGrid();
						chart.draw();
					}
				});
			}
		};
	}
	
	piechartDirective.$inject = [];

	angular.module('fmCore').directive('piechart', piechartDirective);
})();
