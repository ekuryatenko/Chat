var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*app.get('/', function(req, res){
    res.sendfile('index.html');
});*/

// rooms which are currently available in chat
var mainRoom =  'main'
var rooms = {};

io.on('connection', function(socket){
    console.log('a user connected');


    //adds new client
    socket.on('addUser', function(username) {
        console.log('user ' + username + ' adding');
        // store the username in the socket session for this client
        socket.username = username;
        // echo to client they've connected
        socket.emit('updateChat', 'SERVER', username + ', you have connected to this chat');
        // send rooms list to user
        socket.curRoom = mainRoom;
        socket.join(mainRoom);
        socket.emit('updateRooms', rooms, mainRoom);
        // echo to curRoom 1 that a person has connected to their curRoom
        socket.broadcast.to(mainRoom).emit('updateChat', 'SERVER', username + ' has connected to our ROOM');
    });


    socket.on('sendMessage', function(msg){
        io.sockets.in(socket.curRoom).emit('updateChat', socket.username, msg);
    })


    socket.on('switchUserRoom', function(newUserRoom){
        if (isObjContain(rooms, newUserRoom)) {
            //this user goes to existed room
            switchRoom(socket, newUserRoom);
        } else {
            //this user creates new room - changes rooms lists
            rooms.newUserRoom = parseInt(1);
            socket.broadcast.emit('updateRooms', rooms, "updateRoomsList");
            switchRoom(socket, newUserRoom);
        }
    });


    socket.on('disconnect', function(){
        socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' has disconnected');
    });
});

function rewriteRoomsToAllSockets(){
    console.log(io.sockets.clients());
}

function switchRoom(socket, newUserRoom){
    socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has leave our ROOM');
    socket.leave(socket.curRoom);
    rooms[socket.curRoom]--;
    if(rooms[socket.curRoom] == 0){
        delete rooms[socket.curRoom];
    }
    console.log(rooms);
    socket.curRoom = newUserRoom;
    socket.join(newUserRoom);
    socket.emit('updateRooms', rooms, newUserRoom);
    socket.emit('updateChat', 'SERVER', socket.username + ' you has connected to ' + newUserRoom);
    socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has connected to our ROOM');
}


http.listen(3000, function(){
    console.log('listening on *:3000');
});

function isObjContain(rooms, item){
        if(rooms[item] !== undefined)return 1;
        else return 0;
}

