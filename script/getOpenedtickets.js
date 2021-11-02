'use strict';

const parse = require('minimist');
const rp = require('request-promise');
const ObjectsToCsv = require('objects-to-csv');

// We do that because we want
const alias = { 'f': 'from', 't': 'to', 's': 'save' , 'type': 'type', 'filter': 'filter'};
const args = parse(process.argv.slice(2), { alias });

require('dotenv').config();

var user = process.env.USERNAME,
	password = process.env.PASSWORD;

var Headers = {
	'User-Agent':       'Super Agent/0.0.1',
	'Content-Type':     'application/json',
	'x-disable-pagination': 'true'
};

var dateFrom = undefined;
if (args.f !== undefined) {
	dateFrom = new Date(args.f);
}

var dateTo = undefined;
if (args.f !== undefined) {
	dateTo = new Date(args.t);
}

var ticketType;
if (args.type !== undefined) {
	ticketType = args.type;
}

var filterBy;
if (args.filter !== undefined) {
	filterBy = args.filter[0];
} else {
	filterBy = "modified_date";
}

// Send Auth connection
function requestAuth(){
	var urlAuth = process.env.Url+'auth';
	var options = {
		method: 'POST',
		uri: urlAuth,
		json: true,
		form: {
			type: 'normal',
			username: user,
			password: password
		}
	};
	return rp(options);
}

function getIssues(authToken, type = 34){
	var headers = Headers;
	headers['Authorization'] = 'Bearer '+authToken;

	var urlIssues= process.env.Url+'issues\?project\=12\&type='+type+'\&status=82,83';
	// var urlIssues= process.env.Url+'issues\?project\=12\&type='+type;
	console.log(urlIssues);
	var options = {
		uri: urlIssues,
		headers: headers,
		json: true
	};
	return rp(options);
}

requestAuth().then(function(body) {
	getIssues(body.auth_token, ticketType).then(function(body){
		var items = [];

		body.forEach(function(item){
			console.log(item);
			ar dateTicket = new Date(item[filterBy]);
			// console.log(dateTicket);
			// We do that because we want to eliminate ticket before and after a certain date
			if ((undefined !== dateFrom && dateTicket < dateFrom) || (undefined !== dateTo && dateTicket > dateTo)) {
				return;
			}
			// console.log(dateTicket);
			console.log(item.ref+' '+item.subject);
			items.push(item);
		});

		var csv = new ObjectsToCsv(items);
		if (args.s !== undefined) {
			csv.toDisk('./'+args.s, {}).then(function(){
				console.log('File save to '+args.s);
			});
		} else {
			csv.toString().then(function(data) {
				// console.log(data);
			});
		}
	});
});
