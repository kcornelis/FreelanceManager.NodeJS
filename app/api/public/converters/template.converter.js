'use strict';

var _ = require('lodash'),
	Q = require('q');

function singleToDto(template) {
	return template ? {
		id: template.id,
		name: template.name,
		content: template.content,
		hidden: template.hidden
	} : null;
}

function multipleToDto(templates) {
	return _.map(templates, singleToDto);
}

function toDto(t) {
	return _.isArray(t) ? multipleToDto(t) : singleToDto(t);
}

module.exports = {
	toDto: toDto,
	toDtoQ: function(t) {
		return Q.fcall(toDto, t);
	}
};
