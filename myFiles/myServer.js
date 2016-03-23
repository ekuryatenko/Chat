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
        socket.join(socket.curRoom);
        socket.emit('updateRooms', rooms, socket.curRoom);
        // echo to curRoom 1 that a person has connected to their curRoom
        socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', username + ' has connected to our ROOM');
    });

    socket.on('sendMessage', function(msg){
        io.sockets.in(socket.curRoom).emit('updateChat', socket.username, msg);
    })

    socket.on('switchUserRoom', function(newUserRoom){

        if (isArrContain(rooms, newUserRoom)) {
            socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has leave our ROOM');
            socket.leave(socket.curRoom);
            socket.curRoom = newUserRoom;
            socket.join(newUserRoom);
            socket.emit('updateRooms', rooms, newUserRoom);
            socket.emit('updateChat', 'SERVER', socket.username + ' you has connected to ' + newUserRoom);
            socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has connected to our ROOM');
        } else {
            //change rooms view for all users
            rooms.push(newUserRoom);
            socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has leave our ROOM');
            socket.leave(socket.curRoom);
            socket.curRoom = newUserRoom;
            socket.join(newUserRoom);
            socket.emit('updateRooms', rooms, newUserRoom);
            socket.emit('updateChat', 'SERVER', socket.username + ' you has connected to ' + newUserRoom);
            socket.broadcast.emit('updateRooms', rooms, "updateRoomsBroadcast");
            socket.broadcast.to(newUserRoom).emit('updateChat', 'SERVER', socket.username + ' has connected to our ROOM');
        }
    });

    socket.on('disconnect', function(){//Сокет разорван
        socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' has disconnected');
    });


});

function findClientsSocket(roomId, namespace) {
    var res = []
        , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}

function rewriteRoomsToAllSockets(){
    console.log(io.sockets.clients());
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
