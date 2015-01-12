'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	AggregateRootSchema = require('./aggregateroot');

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
		type: Date,
		required: true
	},
	creditTerm: {
		type: Date,
		required: true
	},
	template: {
		type: String,
		required: true,
		trim: true
	},
	to: {
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
		customerNumber: {
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
		price: {
			type: Number,
			required: true
		},
		vatPercentage: {
			type: Number,
			required: true
		},
		total: {
			type: Number,
			required: true	
		}
	}],
	subTotal: {
		type: Number,
		required: true
	},
	vatPerPercentages: [{
		vatPercentage: {
			type: Number,
			required: true
		},
		totalVat: {
			type: Number,
			required: true	
		}
	}],
	totalVat: {
		type: Number,
		required: true
	},
	total: {
		type: Number,
		required: true
	}
});

/*
 *	Write methods
 */

InvoiceSchema.statics.create = function(tenant, number, date, creditTerm){
	
	var invoice = new this();

	invoice.number = number;
	invoice.tenant = tenant;
	invoice.date = date;
	invoice.creditTerm = creditTerm;

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

	if(this.template != template){
		
		this.template = template;
		
		this.apply('InvoiceTemplateChanged', 
		{
			template: template
		});
	}
}

InvoiceSchema.methods.changeTo = function(name, vatNumber, customerNumber, address){

	if(this.to.name != name ||
	   this.to.vatNumber != vatNumber ||
	   this.to.customerNumber != customerNumber ||
	   this.to.address.line1 != address.line1 ||
	   this.to.address.line2 != address.line2 ||
	   this.to.address.postalcode != address.postalcode ||
	   this.to.address.city != address.city){
		
		this.to.name = name;
		this.to.vatNumber = vatNumber;
		this.to.customerNumber = customerNumber;
		this.to.address = address;
		
		this.apply('InvoiceToChanged', 
		{
			name: name,
			customerNumber: customerNumber,
			vatNumber: vatNumber,
			address: address
		});
	}
}

InvoiceSchema.methods.replaceLines = function(lines){

	if(!lines)
		return;
	
	var changed = false;
	if (lines.length != this.lines.length) {
		changed = true;
	}
	else {

		for(var i = 0; i < lines.length; i++){

			if (lines[i].description != this.lines[i].description ||
				lines[i].quantity != this.lines[i].quantity ||
				lines[i].price != this.lines[i].price ||
				lines[i].vatPercentage != this.lines[i].vatPercentage)
			{
				changed = true;
				break;
			}
		}
	}

	if(changed){
		
		this.lines = [];

		for(var i = 0; i < lines.length; i++) {
			this.lines.push(createLine(lines[i].description, lines[i].quantity, lines[i].price, lines[i].vatPercentage));
		}

		recalculateTotals(this);
	
		this.apply('InvoiceLinesChanged', 
		{
			lines: this.lines,
			subTotal: this.subTotal,
			vatPerPercentages: this.vatPerPercentages,
			totalVat: this.totalVat,
			total: this.total
		});	
	}
}

function recalculateTotals(invoice){

	var total = 0;
	var totalPerVat = {};
	var totalVat = 0;

	invoice.vatPerPercentages = [];

	if(invoice.lines.length > 0){

		for(var i = 0; i < invoice.lines.length; i++) {

			var vatKey = invoice.lines[i].vatPercentage.toString()

			if(!totalPerVat.hasOwnProperty(vatKey)){
				totalPerVat[vatKey] = 0;
			}

			total += invoice.lines[i].total;
			totalPerVat[vatKey] += invoice.lines[i].total;
		}

		for(var vatKey in totalPerVat) {

			var totalVatForKey = Math.round((totalPerVat[vatKey] * vatKey) / 100);

			invoice.vatPerPercentages.push({
				vatPercentage: vatKey,
				totalVat: totalVatForKey
			});

			totalVat += totalVatForKey;
		}
	}

	invoice.subTotal = total;
	invoice.totalVat = totalVat;
	invoice.total = total + totalVat;
}

function createLine(description, quantity, price, vatPercentage){
	return {
		description: description,
		quantity: quantity,
		price: price,
		vatPercentage: vatPercentage,
		total: Math.round(quantity * price)
	};
}

mongoose.model('Invoice', InvoiceSchema);
