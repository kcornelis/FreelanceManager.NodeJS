'use strict';

// Configuring the Articles module
angular.module('timeregistrations').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Time', 'timeregistrations', '', '/timeregistrations(.+)?');
		Menus.addMenuItem('topbar', 'Blabla', 'blabla', '', '/blabla(/.+)?');
	}
]);
