"use strict";

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*app.get('/', function(req, res){
 res.sendfile('index.html');
 });*/

//Разрыв связи с сервером - перезагружать архив чата?
//

// roomsList which are currently available in chat
var roomsList = ['MAIN'];
var roomsClients = {'MAIN':0};

io.on('connection', function(socket){
    //adds new client
    socket.on('addNewUserToChat', function(username) {
        console.log('user ' + username + ' is added');
        // store the username in the socket session for this client
        socket.username = username;
        addUserToChat(socket);
    });


    socket.on('sendMessage', function(msg){
        io.sockets.in(socket.curRoom).emit('updateChat', socket.username, msg);
    })


    socket.on('switchUserRoom', function(nextRoom){
        if (isArrContain(roomsList, nextRoom)) {
            //this user goes to existed room
            switchToRoom(socket, nextRoom);
        } else {
            //this user creates new room and goes there
            createNewRoom(nextRoom);
            switchToRoom(socket, nextRoom);
        }
    });


    socket.on('disconnect', function(){
        removeClientFromRooms(socket, socket.curRoom);
        io.emit('updateChat', 'SERVER', socket.username + ' has LEAVE THIS CHAT');
    });
});



//drops user to next existed room - anyway, every user is in MAIN ------ ДЕКОМПОЗИЦИЮ
function switchToRoom(socket, nextRoom){
    //leave current room
    socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has leave our ROOM');
    removeClientFromRooms(socket, socket.curRoom);
    socket.leave(socket.curRoom);

    socket.curRoom = nextRoom;

    //join to room
    socket.join(nextRoom);
    roomsClients[nextRoom]+= 1;
    //rewrite rooms for all users
    socket.emit('updateRooms', roomsList, nextRoom);//make this room active to user
    socket.broadcast.emit('updateRooms', roomsList, "updateRoomsList");//make this room active to user
    //********************************************
    console.log("           SWITCHED");
    console.log(roomsClients);
    //********************************************
    socket.emit('updateChat', 'SERVER', socket.username + ' you has connected to ' + nextRoom);
    socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has connected to our ROOM');

}


http.listen(3000, function(){
    console.log('listening on *:3000');
});



/*
 function isObjContain(roomsList, item){
 if(roomsList[item] !== undefined)return 1;
 else return 0;
 }*/

function isArrContain(arr, item){
    for(var elem of arr){
        if(elem === item)return 1;
    }
    return 0;
}


function addUserToChat(socket){
    socket.curRoom = "MAIN";
    socket.join("MAIN");
    roomsClients["MAIN"]++;
    console.log("           ADDED TO MAIN");
    console.log(roomsClients);

    // echo to client that he is connected
    socket.emit('updateChat', 'SERVER', socket.username + ', you have connected to MAIN CHAT');
    // send roomsList list to this user
    socket.emit('updateRooms', roomsList, socket.curRoom);
    // echo to curRoom 1 that a person has connected to their curRoom
    socket.broadcast.to("MAIN").emit('updateChat', 'SERVER', socket.username + ' has connected to our CHAT');
}

function removeClientFromRooms(socket, room){
    roomsClients[room]--;//decrement qty of users in this room

    if((roomsClients[room] == 0) && (room !== "MAIN")){
        //remove empty room from chat
        delete roomsClients[room];
        var indexToRemove = roomsList.indexOf(room);
        roomsList.splice(indexToRemove, 1);
        //removes this room from lists
        socket.broadcast.emit('updateRooms', roomsList, "updateRoomsList");
        console.log("           REMOVED");
        console.log(roomsClients);
    }
}

function createNewRoom(room){
    roomsList.push(room);
    roomsClients[room] = 0;
    console.log("           CREATED");
    console.log(roomsClients);
}

function rewriteRoomsToAllSockets(){
    console.log(io.sockets.clients());
}