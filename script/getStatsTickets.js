'use strict';

const parse = require('minimist');
const rp = require('request-promise');
const ObjectsToCsv = require('objects-to-csv');
const taiga = require('./lib/taiga');
const fs = require('fs');

require('dotenv').config();

const user = process.env.USERNAME;
const password = process.env.PASSWORD;
const prefixUrl = process.env.Url;

const Headers = {
	'User-Agent': 'Super Agent/0.0.1',
	'Content-Type': 'application/json',
	'x-disable-pagination': 'true'
};


async function getIssues(authToken){
	let headers = Headers;
	headers['Authorization'] = 'Bearer '+authToken;

	const urlIssues = process.env.Url + 'issues\?project\=12\&type=34\&status=78,79';
	let options;
	options = {
		uri: urlIssues,
		headers: headers,
		json: true
	};
	return rp(options);
}

async function execute() {
	const token = await taiga.rsetAuth(user, password);
	const issueStatuses = await taiga.getIssueStatuses(token);
	const project = await taiga.getProjectBySlug(token, 'sqwib-ami-software');

	let indexPriorities = {};
	let templatePriority = {};

	project.priorities.forEach(function(priority){
		indexPriorities[priority.id] = priority.name;
		templatePriority[priority.name] = 0;
	});

	let idBug;
	project.issue_types.map(function (info) {
		if (info.name == "Bug") {
			idBug = info.id;
		}
	});
	let resultPerTags = [];

	const openStatuses = project.issue_statuses.filter(function(status) {
		return(!status.is_closed);
	});

	Promise.all(openStatuses.map(async (status) => {
		let info = {};

		info[status.name] = JSON.parse(JSON.stringify(templatePriority));
		resultPerTags = {}
		if (!status.is_closed) {
			let issues = await taiga.getIssues(token, project.id, idBug, status.id);

			issues.forEach(function(issue) {
				let priorityName = indexPriorities[issue.priority];
				info[status.name][priorityName] += 1;

				issue.tags.forEach(function(tag) {
					if (resultPerTags[tag[0]] === undefined) {
						resultPerTags[tag[0]] = {};
					}
					if (resultPerTags[tag[0]][status.name] === undefined) {
						// console.log(JSON.parse(JSON.stringify(templatePriority)));
						resultPerTags[tag[0]][status.name] = JSON.parse(JSON.stringify(templatePriority));
					}
					resultPerTags[tag[0]][status.name][priorityName] += 1;
				});
			});
			return {"info": info, "result": resultPerTags};
		}
	})).then(infos => {
		// console.log(infos);
		let data = [];
		let dataPerTags = [];
		infos.forEach(function(result) {
			data.push(result.info);
			dataPerTags.push(result.result);
		})

		data = JSON.stringify(data);
		fs.writeFileSync('stats-ticket.json', data);
		dataPerTags = JSON.stringify(dataPerTags);

		fs.writeFileSync('stats-ticket-per-tags.json', dataPerTags);
	});
};

execute();
