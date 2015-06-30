(function() {
	'use strict';
	
	describe('Time Picker Directive Unit Tests:', function() {

		var element;

		var $compile,
			$rootScope,
			$timeout;

		beforeEach(function() {
			jasmine.addMatchers({
				toHaveClockPicker: function() {
					return {
						compare: function(actual) {
							return {
								pass: $(actual).closest('body').find('.clockpicker-popover').length > 0
							};
						}
					};
				},
				notHaveClockPicker: function() {
					return {
						compare: function(actual) {
							return {
								pass: $(actual).closest('body').find('.clockpicker-popover').length === 0
							};
						}
					};
				}
			});
		});

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
		beforeEach(module('karma'));

		beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_) {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
		}));

		describe('When an element contains the clockpicker attribute and gets focus', function() {
			
			beforeEach(function() {

				element = $compile('<div><div data-fm-clockpicker><input id="clockpickertest" type="textbox" /></div></div>')($rootScope);
				element.appendTo(document.body);

				expect(element).notHaveClockPicker();

				$(element).find('#clockpickertest').focus();

				$rootScope.$digest();
			});

			it('should show the clockpicker on screen', function() {
				expect(element).toHaveClockPicker();
			});	
		});
	});
})();
