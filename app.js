var express = require('express');
var app = express();
// Create a Node.js based http server with express warp
var server = require('http').Server(app);

// Create a Socket.IO server and attach it to the express server
var io = require('socket.io')(server);


var myServer = require('./myServer');
var jade = require("jade");
var path = require('path');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//dir for all static files - .css, .js, .html, image
app.use(express.static(__dirname + '/public'));

//compiles jade template for client html and sends it to browser
app.get('/', function(req, res){
    res.render("web");
});

//user connection event
io.on('connection', function(socket){
    myServer.initServer(io, socket);
});



//run express server
var port = Number(process.env.PORT || 3000);
server.listen(port, function(){
    console.log('listening');
});







module.exports = app;
