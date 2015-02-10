(function() {
	'use strict';

	describe('Moment Filter Unit Tests:', function() {
		
		var $filter;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		beforeEach(inject(function(_$filter_){

			$filter = _$filter_;
		}));

		it('should format a moment date', function(){
			$filter('moment')(moment('2014-01-02 12:30'), 'YYYYMMDD').should.eql('20140102');
		});		
	});
})();
