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
        // send rooms list to user
        socket.curRoom = rooms[0];
        socket.emit('updateRooms', rooms, socket.curRoom);
        // echo to curRoom 1 that a person has connected to their curRoom
        socket.broadcast.emit('updateChat', 'SERVER', username + ' has connected to our chat');
    });

    socket.on('sendMessage', function(msg){
        io.to(socket.curRoom).emit('updateChat', socket.username, msg);
    })

    socket.on('createUserRoom', function(){

        if (isArrContain(rooms, socket.username)) {
        } else {
            rooms.push(socket.username);
            socket.curRoom = socket.username;
            socket.emit('updateRooms', rooms, socket.curRoom);
            rewriteRoomsToAllSockets();
        }
    });

    socket.on('disconnect', function(){//Сокет разорван
        socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' has disconnected');
    });


});

function rewriteRoomsToAllSockets(socket){
    console.log(io.sockets.sockets);
}

http.listen(3000, function(){
    console.log('listening on *:3000');
});

function isArrContain(arr, item){
    for(var elem of arr){
        if(elem === item)return 1;
    }
    return 0;
}

