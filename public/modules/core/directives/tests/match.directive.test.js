(function() {
	'use strict';
	 
	describe('Match Directive Unit Tests:', function() {

		var $scope,
			$compile;

		var compiled;

		// Load the main application module
		beforeEach(module(fm.config.moduleName));
		beforeEach(module('karma'));

		beforeEach(inject(function(_$rootScope_, _$compile_) {
			$scope = _$rootScope_.$new();
			$compile = _$compile_;
		}));

		describe('Directive level validation', function() {

			var validTemplate = '<input ng-model="confirmation" fm-match="original"></input>';

			describe('configuration', function() {

				it('does not throw when no ngModel controller is found', function() {
					var naTemplate = '<div fm-match="original"></div>';
					compiled = $compile(naTemplate)($scope);
					$scope.$digest();
				});


				it('is limited to attribute invocation', function() {
					var spy = sinon.spy($scope, '$watch'),
					naTemplates = [
					'<div class="match"></div>',
					'<match></match>'
					];

					for (var i = 0; i < naTemplates.length; i++) {
						compiled = $compile(naTemplates[i])($scope);
						$scope.$digest();
						expect(spy.called).toBe(false);
					}
				});

			});

			describe('behavior', function() {

				it('returns true if no model value has been defined', function() {
					compiled = $compile(validTemplate)($scope);
					expect($scope.confirmation === undefined).toBe(true);
					$scope.$digest();
					expect(compiled.hasClass('ng-valid')).toBe(true);
				});

				it('returns true if $modelValue are identical', function() {
					$scope.confirmation = 'value';
					compiled = $compile(validTemplate)($scope);
					$scope.original = 'value';
					$scope.$digest();
					expect(compiled.hasClass('ng-valid')).toBe(true);
				});

				it('returns false if $modelValue are not identical', function() {
					$scope.confirmation = false;
					$scope.original = undefined;
					compiled = $compile(validTemplate)($scope);
					$scope.$digest();
					expect(compiled.hasClass('ng-valid')).toBe(false);
				});
			});
		});

		describe('Form level validation', function() {

			var form,
			element,
			inputValue = 'testValue';

			beforeEach(function() {
				element = angular.element(
					'<form name="form">' +
					'<input type="text" ng-model="test" name="test"></input>' +
					'<input type="text" fm-match="form.test" ng-model="testConfirm" name="testConfirm"></input>' +
					'</form>'
				);
				$scope.test = inputValue;
				$compile(element)($scope);
				$scope.$digest();
				form = $scope.form;
			});

			it('should check if $viewValues are identical', function() {
				form.testConfirm.$setViewValue(inputValue);
				$scope.$digest();
				expect((form.testConfirm.$error.match) === undefined).toBe(true);
			});

			it('should check if $viewValues are not identical', function() {
				form.testConfirm.$setViewValue(inputValue + 'falseValue');
				$scope.$digest();
				expect(form.testConfirm.$error.match).toBe(true);
			});

			it('should set $modelValue undefined if $viewValues are not identical', function() {
				form.testConfirm.$setViewValue(inputValue + 'falseValue');
				$scope.$digest();
				expect(form.testConfirm.$modelValue === undefined).toBe(true);
			});
		});
	});
})();
