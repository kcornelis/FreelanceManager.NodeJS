(function() {
	'use strict';
	
	describe('Autofocus Directive Unit Tests:', function() {

		var element;
		
		var $compile,
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
				},
				toNotHaveFocus: function() {
					return {
						compare: function(actual) {
							return {
								pass: document.activeElement !== actual
							};
						}
					};
				}
			});
		});

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_) {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
			$timeout = _$timeout_;
		}));

		describe('When an element has the autofocus attribute', function() {
			
			beforeEach(function() {

				element = $compile('<div><input id="focusTest" type="textbox" autofocus /></div>')($rootScope);
				element.appendTo(document.body);

				$rootScope.$digest();
				$timeout.flush();
			});

			it('should have the focus when the page is loaded', function() {
				expect(document.getElementById('focusTest')).toHaveFocus();
			});	
		});

		describe('When an element has the autofocus attribute with a condition (false condition)', function() {
			
			beforeEach(function() {

				element = $compile('<div><input id="focusTest2" type="textbox" autofocus autofocus-condition="{{ false }}" /></div>')($rootScope);
				element.appendTo(document.body);

				$rootScope.$digest();
			});

			it('should have the focus when the page is loaded', function() {
				expect(document.getElementById('focusTest2')).toNotHaveFocus();
			});	
		});

		describe('When an element has the autofocus attribute with a condition (true condition)', function() {
			
			beforeEach(function() {

				element = $compile('<div><input id="focusTest3" type="textbox" autofocus autofocus-condition="{{ true }}" /></div>')($rootScope);
				element.appendTo(document.body);

				$rootScope.$digest();
				$timeout.flush();
			});

			it('should have the focus when the page is loaded', function() {
				expect(document.getElementById('focusTest3')).toHaveFocus();
			});	
		});
	});
})();
