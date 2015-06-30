'use strict';

module.exports = function(app) {

	var core = require('../controllers/core');

	app.route('/').get(core.index);
	app.route('/render').get(core.render);
};
