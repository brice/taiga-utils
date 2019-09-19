'use strict';

const rp = require('request-promise');
const taiga = require('./lib/taiga');
const fs = require('fs');

require('dotenv').config();

const user = process.env.USERNAME;
const password = process.env.PASSWORD;

const Headers = {
	'User-Agent': 'Super Agent/0.0.1',
	'Content-Type': 'application/json',
	'x-disable-pagination': 'true'
};

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
					let priorities = JSON.parse(JSON.stringify(templatePriority));
					if (resultPerTags[tag[0]] === undefined) {
						resultPerTags[tag[0]] = {
							'New':priorities,
							'In progress':priorities,
							'Ready for test':priorities,
							'Testing':priorities
						};

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
		});

		data = JSON.stringify(data);
		fs.writeFileSync('stats-ticket.json', data);

		dataPerTags = JSON.stringify(dataPerTags);
		fs.writeFileSync('stats-ticket-per-tags.json', dataPerTags);
	});
};

execute();
