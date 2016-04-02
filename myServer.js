"use strict";
//************ Тут можно еще для каждого из событий описать отдельные
//************ функции


// roomsList which are currently available in chat
var roomsList = ['MAIN'];
var roomsClients = {'MAIN':0};

exports.initServer = function(sio, serverSocket){
    var io = sio;
    var socket = serverSocket;

    socket.on('addNewUserToChat', function(username) {
        //console.log('user ' + username + ' is added');
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
}


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
    socket.emit('updateChat', 'SERVER', socket.username + ' you has connected to ' + nextRoom);
    socket.broadcast.to(socket.curRoom).emit('updateChat', 'SERVER', socket.username + ' has connected to our ROOM');
}


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
    }
}


function createNewRoom(room){
    roomsList.push(room);
    roomsClients[room] = 0;
}