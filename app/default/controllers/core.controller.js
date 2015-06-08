'use strict';

exports.index = function(req, res) {
	res.render('index');
};

exports.render = function(req, res) {
	res.header('X-Frame-Options', 'SAMEORIGIN');
	res.render('render');
};
