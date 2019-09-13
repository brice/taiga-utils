'use strict';

const request = require('request-promise');

require('dotenv').config();

const prefixUrl = process.env.Url;


let headers = {
	'User-Agent':       'Super Agent/0.0.1',
	'Content-Type':     'application/json'
};

exports.rsetAuth = async function (user, pass) {
	const options = {
		url: prefixUrl+'auth',
		method: 'POST',
		headers: headers,
		json: true,
		form: {type: "normal", username: user, password: pass}
	};

	try {
		const result = await request(options);
		if (undefined !== result.auth_token) {
			return result.auth_token;
		}
		return null;
	} catch (err) {
		throw err;
	}
};

exports.getIssueStatuses = async function (authToken) {
	// let headers = headers;
	headers['Authorization'] = 'Bearer '+authToken;

	const urlStatus = prefixUrl+ 'issue-statuses';
	let options;
	options = {
		uri: urlStatus,
		headers: headers,
		json: true
	};
	return request(options);
}

exports.getIssues = async function(authToken, projectId, typeId, statusId) {
	headers['Authorization'] = 'Bearer '+authToken;
	headers['x-disable-pagination'] = true;
	const urlQuery = prefixUrl+'issues?project='+projectId+'&type='+typeId+'&status='+statusId;
	let options;
	options = {
		uri: urlQuery,
		headers: headers,
		json: true
	};
	return request(options);
};

exports.getProjects = async function(authToken) {
	headers['Authorization'] = 'Bearer '+authToken;

	const urlQuery = prefixUrl+'projects';

	let options;
	options = {
		uri: urlQuery,
		headers: headers,
		json: true
	};
	return request(options);
};

exports.getProjectBySlug = async function(authToken, slug) {
	headers['Authorization'] = 'Bearer '+authToken;

	const urlQuery = prefixUrl+'projects/by_slug?slug='+slug;

	let options;
	options = {
		uri: urlQuery,
		headers: headers,
		json: true
	};
	return request(options);
};

