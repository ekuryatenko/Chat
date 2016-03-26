var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*app.get('/', function(req, res){
 res.sendfile('index.html');
 });*/

// rooms which are currently available in chat
var rooms = ['MAIN'];

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
        socket.curRoom = rooms[0];
        socket.join(rooms[0]);
        socket.emit('updateRooms', rooms, rooms[0]);
        // echo to curRoom 1 that a person has connected to their curRoom
        socket.broadcast.to(rooms[0]).emit('updateChat', 'SERVER', username + ' has connected to our CHAT');
    });


    socket.on('sendMessage', function(msg){
        io.sockets.in(socket.curRoom).emit('updateChat', socket.username, msg);
    })


    socket.on('switchUserRoom', function(newUserRoom){
        if (isArrContain(rooms, newUserRoom)) {
            //this user goes to existed room
            switchRoom(socket, newUserRoom);
        } else {
            //this user creates new room - changes rooms lists for all users
            rooms.push(newUserRoom);
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
    //leave current room
    socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has leave our ROOM');
    socket.leave(socket.curRoom);

    socket.curRoom = newUserRoom;

    //join to new room
    socket.join(newUserRoom);
    socket.emit('updateRooms', rooms, newUserRoom);
    socket.emit('updateChat', 'SERVER', socket.username + ' you has connected to ' + newUserRoom);
    socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has connected to our ROOM');
}


http.listen(3000, function(){
    console.log('listening on *:3000');
});



/*
function isObjContain(rooms, item){
    if(rooms[item] !== undefined)return 1;
    else return 0;
}*/

function isArrContain(arr, item){
    for(var elem of arr){
        if(elem === item)return 1;
    }
    return 0;
}
