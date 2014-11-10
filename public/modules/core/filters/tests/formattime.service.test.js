//'use strict';

(function() {
	describe('FormatTime Filter Unit Tests:', function() {
		//Initialize global variables
		var $filter;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function(_$filter_){

			$filter = _$filter_;
		}));

		it('should format time objects', function(){
			$filter('formattime')({ hour: 5, minutes: 5 }).should.eql('05:05');
			$filter('formattime')({ hour: 23, minutes: 59 }).should.eql('23:59');
			$filter('formattime')({ hour: 0, minutes: 0 }).should.eql('00:00');
		});	

		it('should format time objects (string)', function(){
			$filter('formattime')({ hour: '5', minutes: '5' }).should.eql('05:05');
			$filter('formattime')({ hour: '23', minutes: '59' }).should.eql('23:59');
			$filter('formattime')({ hour: '0', minutes: '0' }).should.eql('00:00');
		});		

		it('should format minutes', function(){
			$filter('formattime')(120).should.eql('02:00');
			$filter('formattime')(0).should.eql('00:00');
			$filter('formattime')(75).should.eql('01:15');
		});		
	});
})();
