require('dotenv').config();
var request = require('request');
var mysql = require('mysql');
var arrDiff = require('arrays-difference');
const fs = require('fs');
var url1= process.env.Url+'auth';
var url2= process.env.Url+'milestones\?project\=12';
var url3= process.env.Url+'userstories?milestone=';

var user = process.env.USERNAME,
pass = process.env.PASSWORD,
hostdb= process.env.host,
userdb= process.env.user,
passwordb= process.env.passwordb,
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
    form: {type: "normal", username: user, password: pass}
}

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
            json_body=JSON.parse(body);
            auth_Token=json_body.auth_token;
            rGetId(auth_Token, req);
        }
       
    });
}

function rGetId(authToken, requete){
    var headers = {
        'Authorization': 'Bearer '+authToken,
        'Content-Type': 'application/json'
    }
    var options = {
        url: url2,
        method: 'GET',
        headers: headers
    }
    var bodyA;
    request(options, function(error, response, body){
       
        bodyA=JSON.parse(body);
        iD=deplieId(bodyA);
        var renduAPI=rGetId2(authToken, iD, requete);
    });
}
    function deplieId(doc){
        for(var prop in doc) {
        if(prop==1){
            break;
        }
        return prop,doc[prop].id;
        }
    }

    function rGetId2(authToken, id, requete){
        var headers = {
            'Authorization': 'Bearer '+authToken,
            'Content-Type': 'application/json'
        }
        var options = {
            url: url3+id,
    
            method: 'GET',
            headers: headers
        }
        var bodyA;
        request(options, function(error, response, body){
         
            bodyA=JSON.parse(body);
            var squash=ticketToTab1(requete);
            var taiga=ticketToTab2(bodyA);
            extract(squash,taiga,bodyA);
        }); 
        return bodyA;
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
                tab[t]={'':'"/AMI 9.0/'+taiga[t].subject+ '","1","T#'+doc[i]+'","'+taiga[t].subject};
            }
        }
    }
    return tab;
}

function makeCsv(documents){
    var filename = "Resultat.csv";
    var doc=JSON.stringify(documents); 
    var doc2=nettoyage(doc);
    fs.writeFile(filename, doc2, function (err) {
      if (err) throw err;
      console.log('Le Document '+filename +' a bien été généré!');
      process.exit(1);
    }); 
}

function nettoyage(document){
    var l=document.length-2;
    var prem=document.split('null').join('');
    var sec=prem.split(']').join('');
    var doc2=sec.substring(7,l);
    var doc3=doc2.split('}').join('\n');
    var doc4=doc3.split(',{"":"').join('');
    var doc5=doc4.split("\\").join('');
    return doc5;
}




