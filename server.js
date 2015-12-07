/* general node/app includes */
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var http = require('http');
var app = express();

/* standard http stuff */
app.use(logger("dev", {
    format: 'dev',
    immediate: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

/* add cors headers, respond immediately to OPTIONS req */
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    var str = 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With';
    res.header('Access-Control-Allow-Headers', str);

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
});


/* catch all route */
app.use('/*', function (req, res) {
    try {
        res.sendfile('public/index.html');
        //res.status(403).send("You are not authorized.");
    } catch (e) {
        //console.log(e);
    }
});

/* create the server */
var server = http.createServer(app);

/* START SERVER */
server.listen(80);
console.log("server started, port 80");

module.exports = app;