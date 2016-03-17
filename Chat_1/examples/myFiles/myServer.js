var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*app.get('/', function(req, res){
 res.sendfile('index.html');
 });*/

// rooms which are currently available in chat
var rooms = ['main'];

io.on('connection', function(socket){
    console.log('a user connected');

    // when the client emits 'adduser', this listens and executes
    socket.on('addUser', function(username) {
        console.log('user ' + username + ' adding');
        // store the username in the socket session for this client
        socket.username = username;
        // echo to client they've connected
        socket.emit('updateChat', 'SERVER', username + ', you have connected to this chat');
        // echo to room 1 that a person has connected to their room
        socket.broadcast.emit('updateChat', 'SERVER', username + ' has connected to our chat');
    });

    socket.on('sendMessage', function(msg){
        io.sockets.emit('updateChat', socket.username, msg);
    })

    socket.on('disconnect', function(){//Сокет разорван
        socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' has disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
