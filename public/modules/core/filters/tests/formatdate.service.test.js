//'use strict';

(function() {
	describe('FormatDate Filter Unit Tests:', function() {
		//Initialize global variables
		var $filter;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function(_$filter_){

			$filter = _$filter_;
		}));

		it('should add leading zeros to numbers', function(){
			$filter('formatdate')({ year: 2010, month: 5, day: 10 }).should.eql('2010-05-10');
		});	

		it('should add leading zeros to strings', function(){
			$filter('formatdate')({ year: '2010', month: '5', day: '10' }).should.eql('2010-05-10');
		});			
	});
})();