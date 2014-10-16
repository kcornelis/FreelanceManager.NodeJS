//'use strict';

(function() {
	describe('Autofocus Directive Unit Tests:', function() {
		//Initialize global variables
		var element,
			$compile,
			$rootScope,
			$timeout;

		beforeEach(function() {
			jasmine.addMatchers({
				toHaveFocus: function() {
					return {
						compare: function(actual) {
							return {
								pass: document.activeElement === actual
							};
						}
					};
				}
			});
		});

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_){

			$compile = _$compile_;
			$rootScope = _$rootScope_;
			$timeout = _$timeout_;

			element = $compile('<div><input id="focusTest" type="textbox" autofocus /></div>')($rootScope);
			element.appendTo(document.body);

			$rootScope.$digest();
			$timeout.flush();
		}));

		it('should focus an element with the autofocus attribute', function(){
			expect(document.getElementById('focusTest')).toHaveFocus();
		});	
	});
})();
