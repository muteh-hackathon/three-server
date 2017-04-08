var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');

app.set('port', (process.env.PORT || 3000));

app.use(express.limit('5mb'));

app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/sightings', function(req, res) {
    console.log("POST /");
    var data = req.body;

    db.serialize(function() {
        db.run('CREATE TABLE IF NOT EXISTS persons (latitude REAL, longitude REAL, timestamp REAL, picture BLOB, extrainfo TEXT)');
        var stmt = db.prepare("INSERT INTO persons VALUES (?, ?, ?, ?, ?)");
        stmt.run(data.lat, data.lon, data.timestamp, data.picture, data.extrainfo, function() {
            res.send({ status: "success" });
        });
        stmt.finalize();
    });
});

app.get('/sightings', function(req, res) {
    console.log("GET /");
    var query = req._parsedUrl.query;
    if (query != null) {
        var db = new sqlite3.Database('database.db');
        console.log("Send specific query.");
        var queryString = query.split('&');
        var databaseQuery = "";

        for (var i = 0; i < queryString.length; i++) {
            var query = queryString[i].split('=');
            if (databaseQuery.length != 0) {
                databaseQuery += " AND ";
            }

            if (query[0] == 'lat') {
                databaseQuery += 'latitude=' + query[1].toString();
            } else if (query[0] == 'lon') {
                databaseQuery += 'longitude=' + query[1].toString();
            } else if (query[0] == 'radius') {
                databaseQuery += 'radius=' + query[1].toString();
            }
        }

        databaseQuery = "SELECT * FROM persons WHERE " + databaseQuery + ";";
        console.log(databaseQuery);
        values = [];
        db.each(databaseQuery, function(err, row) {
            values.push(row);
        });

        db.close(function() {
            res.send(values);
            console.log(values);
        });
    } else {
        console.log("Send everything.");
        var db = new sqlite3.Database('database.db');
        values = []
        db.each('SELECT * FROM persons', function(err, row) {
            values.push(row);
        }, function() {
            res.send(values);
        });

    }
});

app.listen(app.get('port'), function() {
    console.log("Server is listening on: ", app.get('port'));
});