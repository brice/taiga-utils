var jsonloader = require('jsonloader');
var file = new jsonloader('package.json');
var request = require('request');
var mysql = require('mysql');
const fs = require('fs')
var url1= "1 ERE URL DU SCRIPT GetCSVDATA";
var url2= '2e URL DU SCRIPT GetCSVDATA';
var url3='3e URL DU SCRIPT GetCSVDATA limite après"="';

//En premier PACKAGE.JSON A CONFIGURER USER ET PASSWORD
var user = file.USERNAME;
var pass = file.PASSWORD;

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
// Configure the request
var options2 = {
    url: url2,
    method: 'GET',
    headers: headers,
    form: {type: "normal", username: user, password: pass}
}

// connetion DataBase
    var con = mysql.createConnection({

        host: "A REMPLIR",
        user: "A REMPLIR",
        password: "A REMPLIR",
        database: "A REMPLIR"
    });
    
    con.connect(function(err) {
        if (err) throw err;
        con.query("SELECT * FROM REQUIREMENT_VERSION WHERE REFERENCE LIKE '%T%' ", function (err, result, fields) {
        if (err) throw err;
        requete1=JSON.stringify(result);
        requete=JSON.parse(requete1);
        console.log(requete);
        rsetAuth(requete);
        });
        
    });
    

 //Start the request
 function rsetAuth(req){
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
           // console.log(body)
            json_body=JSON.parse(body);
            auth_Token=json_body.auth_token;
            console.log('la valeur du token est '+auth_Token);
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
        console.log("la longueur requeste est "+bodyA.length);
        iD=deplieId(bodyA);
        var l=iD.length;
        console.log("la valeur de l'id est de " +iD);
        var renduAPI=rGetId2(authToken, iD, requete);
    });
}
    function deplieId(doc){
        for(var prop in doc) {
        console.log("la longueur requeste est "+prop,doc[prop].length);  
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
            console.log('nom de la page url='+url3+id);
            bodyA=JSON.parse(body);
            extract(requete,bodyA);
        }); 
        return bodyA; 
    }

function extract(squash, taiga){
    var refT,j=0,compt, comptM=0, max=taiga.length, 
    deb='T#', pred='/AMI 9.0/'
    var retour={};
    var tab=[];

    for(var prop in squash) {
         refS=parseInt(squash[prop].REFERENCE.substring(2));
         compt=0;
         for(var prop2 in taiga) {
           refT=taiga[prop2].ref
           if(refT!=refS)
           {
               compt++;
               if(compt==max){
                retour[prop2]=pred+','+taiga[prop2].subject+ ", 1 ,"+ deb+refT + ','+taiga[prop2].subject;
               }   
            }
            j++;  
        }
    }
    tab.push(retour);
    console.log("valeur(s) finale(s) retenue(s)");
    console.log(retour); 
    makeCsv(retour);
    console.log(tab); 
}
function makeCsv(documents){
    var filename   = "Resultat.csv";
    var doc=JSON.stringify(documents); 
    fs.writeFile(filename, doc, function (err) {
      if (err) throw err;
      console.log('Le Document a bien été généré!');
    }); 
}




