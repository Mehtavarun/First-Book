var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var hoganExpress = require('hogan-express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false});
var session = require('express-session');
var mongo = require('mongodb').MongoClient;
var path = require('path');
var qs = require('querystring');
var fs = require('fs');
var messages = [];
var files = [];

require('./routes.js')(app, urlencodedParser, mongo, session, fs, io);
require('./socket.js')(io, messages, files);

app.set('views',path.join(__dirname, 'views'));
app.engine('html',hoganExpress);
app.set('view engine','html');
app.use(cookieParser());
app.use(express.static('views'))

http.listen(6500);