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

		it('should add leading zeros to numbers', function(){
			$filter('formattime')(5).should.eql('05');
			$filter('formattime')(60).should.eql('60');
			$filter('formattime')(0).should.eql('00');
		});	

		it('should add leading zeros to strings', function(){
			$filter('formattime')('5').should.eql('05');
			$filter('formattime')('60').should.eql('60');
			$filter('formattime')('0').should.eql('00');
		});			
	});
})();
