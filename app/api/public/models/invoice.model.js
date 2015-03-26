'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	AggregateRootSchema = require('./aggregateroot');


/**
 * Validators
 */	
var yearValidation = [function(v){ return v >= 1900 && v <= 2200; }, 'Path `{PATH}` ({VALUE}) should be between 1900 and 2200'];
var monthValidation = [function(v){ return v >= 1 && v <= 12; }, 'Path `{PATH}` ({VALUE}) should be between 1 and 12'];
var dayValidation = [function(v){ return v >= 1 && v <= 31; }, 'Path `{PATH}` ({VALUE}) should be between 1 and 31'];

/**
 * Client Schema
 */
var InvoiceSchema = new AggregateRootSchema({
	tenant: {
		type: String,
		required: true,
		index: true
	},
	number: {
		type: String,
		required: true,
		trim: true
	},
	date: {
		year: { type: Number, required: true, validate: yearValidation },
		month: { type: Number, required: true, validate: monthValidation },
		day: { type: Number, required: true, validate: dayValidation },
		numeric: { type: Number, required: true, index: true }
	},
	creditTerm: {
		year: { type: Number, required: true, validate: yearValidation },
		month: { type: Number, required: true, validate: monthValidation },
		day: { type: Number, required: true, validate: dayValidation },
		numeric: { type: Number, required: true, index: true }
	},
	template: {
		type: String,
		required: true,
		trim: true
	},
	customer: {
		name: {
			type: String,
			required: true,
			trim: true
		}, 
		vatNumber: {
			type: String,
			required: true,
			trim: true
		}, 
		number: {
			type: String,
			required: true,
			trim: true
		},
		address: {
			line1: {
				type: String,
				required: true,
				trim: true
			},
			line2: {
				type: String,
				required: false,
				trim: true
			},
			postalcode: {
				type: String,
				required: true,
				trim: true
			},
			city: {
				type: String,
				required: true,
				trim: true
			}
		}
	},
	lines: [{
		description: {
			type: String,
			required: true
		},
		quantity: {
			type: Number,
			required: true
		},
		priceInCents: {
			type: Number,
			required: true
		},
		vatPercentage: {
			type: Number,
			required: true
		},
		totalInCents: {
			type: Number,
			required: true	
		}
	}],
	subTotalInCents: {
		type: Number,
		required: true
	},
	vatPerPercentages: [{
		vatPercentage: {
			type: Number,
			required: true
		},
		totalVatInCents: {
			type: Number,
			required: true	
		}
	}],
	totalVatInCents: {
		type: Number,
		required: true
	},
	totalInCents: {
		type: Number,
		required: true
	},
	linkedTimeRegistrations: [ String ]
});

/*
 *	Middleware
 */

InvoiceSchema.post('save', function (doc) {

	mongoose.model('TimeRegistration').find(
	{ 
		tenant: doc.tenant,
		deleted: false,
		_id: { $in : doc.linkedTimeRegistrations }
	},
	function(err, timeRegistrations) 
	{
		for(var i = 0; i < timeRegistrations.length; i++) {
			if(!timeRegistrations[i].invoiced) {
				timeRegistrations[i].markInvoiced(doc.id);
				timeRegistrations[i].save();
			}
		}
	});
});

 /*
 *	Private methods
 */
function createDateObject(date){

	if(!date)
		return;

	var year = Math.floor(date / 10000);
	var month = Math.floor((date - (year * 10000)) / 100);
	var day = Math.floor(date - (year * 10000) - (month * 100));

	return {
		numeric: date,
		year: year,
		month: month,
		day: day
	};
}

function recalculateTotals(invoice){

	var totalInCents = 0;
	var totalPerPercentage = {};
	var totalVatInCents = 0;

	invoice.vatPerPercentages = [];

	if(invoice.lines.length > 0){

		for(var i = 0; i < invoice.lines.length; i++) {

			var varPercentage = invoice.lines[i].vatPercentage.toString();

			if(!totalPerPercentage.hasOwnProperty(varPercentage)){
				totalPerPercentage[varPercentage] = 0;
			}

			totalInCents += invoice.lines[i].totalInCents;
			totalPerPercentage[varPercentage] += invoice.lines[i].totalInCents;
		}

		for(var percentage in totalPerPercentage) {

			var totalVatInCentsForKey = Math.round((totalPerPercentage[percentage] * percentage) / 100);

			invoice.vatPerPercentages.push({
				vatPercentage: percentage,
				totalVatInCents: totalVatInCentsForKey
			});

			totalVatInCents += totalVatInCentsForKey;
		}
	}

	invoice.subTotalInCents = totalInCents;
	invoice.totalVatInCents = totalVatInCents;
	invoice.totalInCents = totalInCents + totalVatInCents;
}

InvoiceSchema.statics.create = function(tenant, number, date, creditTerm){
	
	var invoice = new this();

	invoice.number = number;
	invoice.tenant = tenant;
	invoice.date = createDateObject(date);
	invoice.creditTerm = createDateObject(creditTerm);
	invoice.lines = [];

	// set totals to 0
	recalculateTotals(invoice);

	invoice.apply('InvoiceCreated', 
	{
		tenant: tenant,
		number: number,
		date: date,
		creditTerm: creditTerm
	});		

	return invoice;
};

InvoiceSchema.methods.changeTemplate = function(template){

	if(this.template !== template){
		
		this.template = template;
		
		this.apply('InvoiceTemplateChanged', 
		{
			template: template
		});
	}
};

InvoiceSchema.methods.changeCustomer = function(name, vatNumber, number, address){

	if(this.customer.name !== name ||
	   this.customer.vatNumber !== vatNumber ||
	   this.customer.number !== number ||
	   this.customer.address.line1 !== address.line1 ||
	   this.customer.address.line2 !== address.line2 ||
	   this.customer.address.postalcode !== address.postalcode ||
	   this.customer.address.city !== address.city){
		
		this.customer.name = name;
		this.customer.vatNumber = vatNumber;
		this.customer.number = number;
		this.customer.address = address;
		
		this.apply('InvoiceCustomerChanged', 
		{
			name: name,
			number: number,
			vatNumber: vatNumber,
			address: address
		});
	}
};

function createLine(description, quantity, priceInCents, vatPercentage){
	return {
		description: description,
		quantity: quantity,
		priceInCents: priceInCents,
		vatPercentage: vatPercentage,
		totalInCents: Math.round(quantity * priceInCents)
	};
}

InvoiceSchema.methods.replaceLines = function(lines){

	if(!lines)
		return;
	
	var changed = false;
	if (lines.length !== this.lines.length) {
		changed = true;
	}
	else {

		for(var i = 0; i < lines.length; i++){

			if (lines[i].description !== this.lines[i].description ||
				lines[i].quantity !== this.lines[i].quantity ||
				lines[i].priceInCents !== this.lines[i].priceInCents ||
				lines[i].vatPercentage !== this.lines[i].vatPercentage)
			{
				changed = true;
				break;
			}
		}
	}

	if(changed){
		
		this.lines = [];

		for(var j = 0; j < lines.length; j++) {
			this.lines.push(createLine(lines[j].description, lines[j].quantity, lines[j].priceInCents, lines[j].vatPercentage));
		}

		recalculateTotals(this);
	
		this.apply('InvoiceLinesChanged', 
		{
			lines: this.lines,
			subTotalInCents: this.subTotalInCents,
			vatPerPercentages: this.vatPerPercentages,
			totalVatInCents: this.totalVatInCents,
			totalInCents: this.totalInCents
		});	
	}
};

InvoiceSchema.methods.linkTimeRegistrations = function(timeRegistrationIds){

	if(!timeRegistrationIds)
		return;

	for(var i = 0; i < timeRegistrationIds.length; i++){
		this.linkedTimeRegistrations.push(timeRegistrationIds[i]);
	}

	this.apply('InvoiceTimeRegistrationsLinked', 
	{
		timeRegistrationIds: timeRegistrationIds
	});	
};

mongoose.model('Invoice', InvoiceSchema);
