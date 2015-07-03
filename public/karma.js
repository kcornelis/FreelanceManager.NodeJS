(function() {
	'use strict';

	var karma = fm.module.register('karma');

	function unknownRouteFix($urlRouterProvider) {
		$urlRouterProvider.otherwise(function() { return false; });
	}

	function stateMock() {
		var expectedTransitions = [];
		var trackingTransitions = false;

		var transitionTo = function(stateName, stateParams) {

			if(!trackingTransitions)
				return;

			if(expectedTransitions.length > 0) {
				var expectedState = expectedTransitions.shift();
				if(expectedState.name !== stateName || JSON.stringify(stateParams) !== JSON.stringify(expectedState.params)) {
					throw Error('Expected transition to state: ' + expectedState.name + '(' + JSON.stringify(expectedState.params) + ') but transitioned to ' + stateName + '(' + JSON.stringify(stateParams) + ')' );
				}
				current = { name: stateName, params: stateParams };
			}else{
				throw Error('No more transitions were expected!');
			}
		};

		var go = transitionTo;   

		var expectTransitionTo = function(stateName, stateParams) {
			trackingTransitions = true;
			expectedTransitions.push({ name: stateName, params: stateParams });
		};

		var current = { name: '' };

		var ensureAllTransitionsHappened = function() {
			if(expectedTransitions.length > 0) {
				throw Error('Not all transitions happened!');
			}
		};

		return {
			transitionTo: transitionTo,
			go: go,
			expectTransitionTo: expectTransitionTo,
			current: current,
			ensureAllTransitionsHappened: ensureAllTransitionsHappened
		};
	}

	unknownRouteFix.$inject = ['$urlRouterProvider'];
	stateMock.$inject = [];

	karma.config(unknownRouteFix);
	karma.service('$state', stateMock);

})();
