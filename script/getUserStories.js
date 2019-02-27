// 'use strict';

require('dotenv').config();
var request = require('request');
var mysql = require('mysql');
var arrDiff = require('arrays-difference');

const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const TaigaLib = require('taiga-lib');

var url1= process.env.Url+'auth';
var url2= process.env.Url+'milestones\?project\=12';
var url3= process.env.Url+'userstories?milestone=';

if(url1.substring(0,5)!="https")
{
    console.log("le protocole de votre url n'est pas correct, vérifiez bien que dans votre url il correspond à https");
    process.exit(1);

}

var user = process.env.USERNAME,
pass = process.env.PASSWORD,
hostdb= process.env.host,
userdb= process.env.user,
passwordb= process.env.password,
databasedb= process.env.database;

var iD;
var requete;
// Save these for future requests
var auth_Token;
var json_body;
// Set the headers
var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/json'
}
// Configure the request
var options = {
    url: url1,
    method: 'POST',
    headers: headers,
    json: true,
    form: {type: "normal", username: user, password: pass}
};

// connetion DataBase
    var con = mysql.createConnection({
        host: hostdb,
        user: userdb,
        password: passwordb,
        database: databasedb
    });
    
con.connect(function(err) {
    if (err) throw err;
    con.query("SELECT * FROM REQUIREMENT_VERSION WHERE REFERENCE LIKE '%T%' ", function (err, result, fields) {
        if (err) throw err;
        requete=JSON.stringify(result);
        resultat=JSON.parse(requete);
        rsetAuth(resultat);
    });
});

//Start the request
function rsetAuth(req){
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            rGetId(body.auth_token, req);
        }
    });
}

function rGetId(authToken, requete){
    let headers = {
        'Authorization': 'Bearer '+authToken,
        'Content-Type': 'application/json'
    };
    let options = {
        url: url2,
        method: 'GET',
        headers: headers,
        json: true
    };

    request(options, function(error, response, body){
        // bodyA=JSON.parse(body);
        iD=deplieId(body);
        var renduAPI=rGetId2(authToken, iD, requete);
    });
}
    function deplieId(doc){
        for(var prop in doc) {
        if(prop==1){
            break;
        }
        return prop, doc[prop].id;
        }
    }

    function rGetId2(authToken, id, requete){
        const headers = {
            'Authorization': 'Bearer '+authToken,
            'Content-Type': 'application/json'
        };
        const options = {
            url: url3+id,
    
            method: 'GET',
            headers: headers,
            json: true
        };
        request(options, function(error, response, body){
            var squash=ticketToTab1(requete);
            var taiga=ticketToTab2(body);
            extract(squash,taiga,body);
            return body;
        }); 
        return '';
    }


function ticketToTab1(bod){
    var retour=[];
    for(var t in bod){
        retour[t]=bod[t].REFERENCE.substring(2);
    }
    return retour;
}

function ticketToTab2(bod){
    var retour=[];
    for(var t in bod){
        retour[t]=String(bod[t].ref);
    }
    return retour;
}

function extract(squash, taiga, taigaBrut)
{
    //renvoie la différence entre les données squash et ceux de taiga (squash - taiga)
    var retour=compare(taiga,squash);
    var tab=[];
    var tab2=toInt(retour);
    var retour2=misFormat(tab2,taigaBrut);
    tab.push(retour2);
    makeCsv(retour2);
}

function compare(ta,sq){
    return arrDiff(ta,sq);   
}

function toInt(docStr){
    var tab=[];
    for(var t in docStr){
        tab.push(parseInt(docStr[t]));
    }
    return tab;
}

function misFormat(doc,taiga){
    var tab=[];
    for(var t in taiga){
        for(var i in doc){
            if(doc[i]==taiga[t].ref){
                tab[t]=['','/AMI 9.0/'+taiga[t].subject,'1','T#'+doc[i],taiga[t].subject];
            }
        }
    }
    return tab;
}

function makeCsv(documents){
    var filename = "Resultat.csv";

    var csv = new ObjectsToCsv(documents);

    csv.toDisk('./'+filename, {}).then(function(){
        console.log('File save to '+filename);
        process.exit(0);
    });
}
