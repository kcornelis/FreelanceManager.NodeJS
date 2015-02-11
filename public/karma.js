ApplicationConfiguration.registerModule('karma');

angular.module('karma', [])

.config(function ($urlRouterProvider) {
	'use strict';

	$urlRouterProvider.otherwise(function(){ return false; });
})

.service('$state', function(){

	this.expectedTransitions = [];
	this.trackingTransitions = false;

	this.transitionTo = function(stateName, stateParams){
		
		if(!this.trackingTransitions)
			return;

		if(this.expectedTransitions.length > 0){
			var expectedState = this.expectedTransitions.shift();
			if(expectedState.name !== stateName || JSON.stringify(stateParams) !== JSON.stringify(expectedState.params)){
				throw Error('Expected transition to state: ' + expectedState.name + '(' + JSON.stringify(expectedState.params) + ') but transitioned to ' + stateName + '(' + JSON.stringify(stateParams) + ')' );
			}
			this.current = { name: stateName, params: stateParams };
		}else{
			throw Error('No more transitions were expected!');
		}
	}

	this.go = this.transitionTo;   

	this.expectTransitionTo = function(stateName, stateParams){
		this.trackingTransitions = true;
		this.expectedTransitions.push({ name: stateName, params: stateParams });
	}

	this.current = { name: '' };

	this.ensureAllTransitionsHappened = function(){
		if(this.expectedTransitions.length > 0){
			throw Error('Not all transitions happened!');
		}
	}
});;