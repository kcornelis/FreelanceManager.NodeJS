// TODO unit test
// From the angle project
angular.module('core').service('navSearch', function() {
	var navbarFormSelector = 'form.navbar-form';
	return {
		toggle: function() {
			
			var navbarForm = $(navbarFormSelector);

			navbarForm.toggleClass('open');
			
			var isOpen = navbarForm.hasClass('open');
			
			navbarForm.find('input')[isOpen ? 'focus' : 'blur']();

		},

		dismiss: function() {
			$(navbarFormSelector)
				.removeClass('open')      // Close control
				.find('input[type="text"]').blur() // remove focus
				.val('')                    // Empty input
				;
		}
	};

});