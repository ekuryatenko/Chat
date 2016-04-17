"use strict";
//************ Очищать базу при переполнении - оставлять по 10 сообщений в MAIN
//************ Удалять базу уничтожаемой комнаты?
//************ Теряется одно сообщение при переходе в MAIN
//************ Теряется свое сообщение после возврата из другой комнаты???
//************ Для каждого из событий прописать отдельные функции
//************ Продумать - если user при вводе имени нажал "Отмена"
//************ Сохранение имен юзеров в текущем чате + присваивать цвет для сообщений
//************ disconnect - настроить 10 попыток восстановления связи

var SocketIO = require('socket.io');
// Establish a connection to the mongo database
var mongoClient = require('mongodb').MongoClient;
var io;

// roomsList which rooms are currently available in chat
var roomsList = ['MAIN'];
var roomsClients = {'MAIN':0};

exports.initServer = function(listener, callback){
    mongoClient.connect('mongodb://localhost:27017/chat', function (err, db) {
        console.log("connected to dataBase: " + db.databaseName);

        io = SocketIO.listen(listener);//????????????

        io.on('connection', function (socket) {
            socket.on('addNewUserToChat', function (username) {
                //console.log('user ' + username + ' is added');
                // store the username in the socket session for this client
                socket.username = username;
                addUserToChat(socket);

                sendOldMsgsFromRoom(socket, db);
            });

            socket.on('sendMessage', function (msg) {
                //adds this msg to db
                var collection = db.collection('messages');
                var new_msg = {
                    room:socket.curRoom,
                    time:new Date(),
                    user:socket.username,
                    message:msg
                };
                collection.insertOne(new_msg);

                io.sockets.in(socket.curRoom).emit('updateChat', new_msg);
            })

            socket.on('switchUserRoom', function (nextRoom) {
                if (isArrContain(roomsList, nextRoom)) {
                    //this user goes to existed room
                    switchToRoom(socket, nextRoom, db);
                } else {
                    //this user creates new room and goes there
                    createNewRoom(nextRoom);
                    switchToRoom(socket, nextRoom, db);
                }
            });

            socket.on('disconnect', function () {
                removeClientFromRooms(socket, socket.curRoom);

                var msg1 = {
                    room:'MAIN',
                    time:new Date(),
                    user:"SERVER",
                    message:socket.username + ' has LEAVE THIS CHAT'
                };
                io.emit('updateChat', msg1);
            });
        });

        setTimeout(function () {
            callback()
        }, 300); // wait for socket to boot
    });
}


//drops user to next existed room - anyway, every user is in MAIN ------ ДЕКОМПОЗИЦИЮ
function switchToRoom(socket, nextRoom, db){
    //leave current room
    var msg1 = {room: socket.curRoom,
                time: new Date(),
                user: "SERVER",
                message: socket.username + ' has leave our ROOM'};
    socket.broadcast.to(socket.curRoom).emit('updateChat', msg1);
    removeClientFromRooms(socket, socket.curRoom);
    socket.leave(socket.curRoom);
    socket.curRoom = nextRoom;

    //join to room
    socket.join(nextRoom);
    roomsClients[nextRoom]+= 1;

    //rewrite rooms for other users
    socket.broadcast.emit('updateRooms', roomsList, "updateRoomsList");//make this room visible to other users
    var msg2 = {room: nextRoom,
                time: new Date(),
                user: "SERVER",
                message: socket.username + ' has connected to our ROOM'};
    socket.broadcast.to(socket.curRoom).emit('updateChat', msg2);

    //rewrite rooms for this user
    socket.emit('updateRooms', roomsList, nextRoom);//make this room active to this user
    sendOldMsgsFromRoom(socket, db);
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
    var msg1 = {room: "MAIN",
                time: new Date(),
                user: "SERVER",
                message: socket.username + ', you have connected to MAIN CHAT'};
    socket.emit('updateChat', msg1);

    // send roomsList list to this user
    socket.emit('updateRooms', roomsList, socket.curRoom);
    // echo to curRoom 1 that a person has connected to their curRoom
    var msg2 = {room: "MAIN",
                time: new Date(),
                user: "SERVER",
                message: socket.username + ' has connected to our CHAT'};
    socket.broadcast.to("MAIN").emit('updateChat', msg2);

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


function sendOldMsgsFromRoom(socket, db){
    // send old messages to user
    var collection = db.collection('messages');
    collection.find({room:socket.curRoom}).limit(50).sort({"time": -1}).toArray(function (err, arr) {
        if (err) throw err;

        socket.emit('msgArr', arr);//sends messages array to client

        var msg1 = {room: socket.curRoom,
                    time: new Date(),
                    user: "SERVER",
                    message: socket.username + ' you has connected to ' + socket.curRoom};
        socket.emit('updateChat', msg1);
    });
}

