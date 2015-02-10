(function() {
	'use strict';
	
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
		beforeEach(module('karma'));

		describe('When an element has the autofocus attribute', function() {
			
			beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_){

				$compile = _$compile_;
				$rootScope = _$rootScope_;
				$timeout = _$timeout_;

				element = $compile('<div><input id="focusTest" type="textbox" autofocus /></div>')($rootScope);
				element.appendTo(document.body);

				$rootScope.$digest();
				$timeout.flush();
			}));

			it('should focus the element', function(){
				expect(document.getElementById('focusTest')).toHaveFocus();
			});	
		});
	});
})();
