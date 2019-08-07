// 'use strict';

require('dotenv').config();

const request = require('request-promise');
const parse = require('minimist');
const mysql = require('mysql');
const util = require('util');
const arrDiff = require('arrays-difference');

const prefixUrl = process.env.Url;

const alias = { 'f': 'from' };
const args = parse(process.argv.slice(2), { alias });

if(prefixUrl.substring(0,5)!="https")
{
    console.log("le protocole de votre url n'est pas correct, vérifiez bien que dans votre url il correspond à https");
    process.exit(1);
}

// We get all the env variables
const user = process.env.USERNAME,
pass = process.env.PASSWORD,
hostdb= process.env.host,
userdb= process.env.user,
passwordb= process.env.password,
databasedb= process.env.database;

// Set the headers
let headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/json'
};

let dateFrom = undefined;
if (args.f !== undefined) {
	dateFrom = new Date(args.f);
}

// Start connexion to the DataBase
const conn = mysql.createConnection({
    host: hostdb,
    user: userdb,
    password: passwordb,
    database: databasedb
});

const query = util.promisify(conn.query).bind(conn);

async function getRequirements() {
    try {
		const rows = await query("SELECT * FROM REQUIREMENT_VERSION WHERE REFERENCE LIKE '%T%' ");
		return rows.map(function(requirement){
			return requirement.REFERENCE;
		});
    } catch(err) {
        throw err;
    } finally {
        conn.end()
    }
}

async function rsetAuth(){
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
}

async function getMilestones(authToken) {
    headers['Authorization'] = 'Bearer '+authToken;

    let options = {
        url: prefixUrl+'milestones\?project\=12',
        method: 'GET',
        headers: headers,
        json: true
    };

	try {
		return await request(options);
	} catch(err) {
	    throw err;
    }
}

async function getStory(authToken, storyId) {
	headers['Authorization'] = 'Bearer '+authToken;

	let options = {
		url: prefixUrl+'userstories/'+storyId,
		method: 'GET',
		headers: headers,
		json: true
	};

	try {
		return await request(options);
	} catch(err) {
		throw err;
	}
}

async function execute() {
    const requirementsReferences = await getRequirements();
    const token = await rsetAuth();
    const milestones = await getMilestones(token);
    let stories = [];

    milestones.forEach(function(sprint) {

    	if (undefined !== dateFrom) {
			let dateSprint = new Date(sprint.estimated_start);
			if (dateSprint < dateFrom) {
				return;
			}
		}
		let index = sprint.user_stories.map(function(story) {
			stories['T#'+story.ref] = story.id;
			return 'T#'+story.ref;
		});
		const diff = arrDiff(index,requirementsReferences);

		Promise.all(diff.map(async (storyRef) => {
			let story = await getStory(token, stories[storyRef]);
			console.log(storyRef+':'+story.subject+"\n"+story.description+"\n");
		}));
	});
}

execute();
