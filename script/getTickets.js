'use strict';

const parse = require('minimist');
const rp = require('request-promise');
const ObjectsToCsv = require('objects-to-csv');

// We do that because we want
const alias = { 'f': 'from', 't': 'to', 's': 'save' };
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

function getIssues(authToken){
	var headers = Headers;
	headers['Authorization'] = 'Bearer '+authToken;

	var urlIssues= process.env.Url+'issues\?project\=12\&type=34\&status=82';
	var options = {
		uri: urlIssues,

		headers: headers,
		json: true
	};
	return rp(options);
}

requestAuth().then(function(body) {
	getIssues(body.auth_token).then(function(body){
		var items = [];

		body.forEach(function(item){
			var dateTicket = new Date(item.modified_date);

			// We do that because we want to eliminate ticket before and after a certain date
			if ((undefined !== dateFrom && dateTicket < dateFrom) || (undefined !== dateTo && dateTicket > dateTo)) {
				return;
			}

			items.push(item);
		});

		var csv = new ObjectsToCsv(items);
		if (args.s !== undefined) {
			csv.toDisk('./'+args.s, {}).then(function(){
				console.log('File save to '+args.s);
			});
		} else {
			csv.toString().then(function(data) {
				console.log(data);
			});
		}

	});
});
