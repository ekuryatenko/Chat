"use strict";
var userName = "";
//-------window.onload--------
var roomsList = document.getElementById("roomsList");
/*rewriteRooms(rooms, userName);*/



//----EVENTS------------------
var sendButton = document.querySelector('#submitmsg');
/*sendButton.addEventListener('click', function() {
    replaceTextToChat(textField);
});*/

var roomHref = document.querySelector('#createRoom');



//----SERVER EVENTS------------------
var socket = io.connect('http://localhost:3000');


socket.on('connect', function () {
    userName = prompt("What's your name?");

    socket.emit('addUser', userName);
    console.log(userName);
});


socket.on('updateChat', function (userName, msg) {
    logToChatBox(userName, msg);
});


socket.on('updateRooms', function (roomsArr, newRoomForUser) {
    //some other user creates new room - adds it to list
    if(newRoomForUser == "updateRoomsList"){
        rewriteRooms(roomsArr, socket.curRoom);
    }else {
        //this user has changed the room - matches it in list
        socket.curRoom = newRoomForUser;
        rewriteRooms(roomsArr, newRoomForUser);
        writeNameToWrapDiv(userName, newRoomForUser);
    }
});


socket.on('connect_error', function () {
    logToChatBox('<b style="color:red">'+ 'BROWSER' + '</b>', "Connect error");
});



//----CLIENT EVENTS------------------
sendButton.onclick = function() {
    var form = document.forms[0];
    var textField = form.elements.usermsg;
    socket.emit('sendMessage', textField.value);
    textField.value = "";
}

roomHref.addEventListener('click', function() {
    socket.emit('switchUserRoom', userName);
});






//----FUNCTIONS-----------------
function logToChatBox(userName, msg){
    document.querySelector('#chatbox').innerHTML += ('<b>'+ userName + ':</b> ' + msg + "<br>");
}

function replaceTextToChat(textField){
    var msg = textField.value;
    textField.value = "";
    logToChatBox(msg);
}

function writeNameToWrapDiv(name, newRoomForUser){
    document.querySelector('#userName').innerHTML = name + ". You are in " + newRoomForUser + " room.";
}

function rewriteRooms(roomsArr, userRoom){
    cleanParent(roomsList);

    for(let index of roomsArr){
        if(index == userRoom){//userRoom is inactive
            let newLi = document.createElement('li');
            newLi.innerHTML = index;
            roomsList.appendChild(newLi);
        }else{
            let href = document.createElement('a');
            href.href = "#";
            href.innerHTML = index;
            href.addEventListener('click', function(){
                socket.emit('switchUserRoom', index);
            });

            let newLi = document.createElement('li');
            newLi.appendChild(href);

            roomsList.appendChild(newLi);
        }
    }
}

function cleanParent(parent){
    if(parent.children.length !== 0) {
        for (var i = (parent.children.length - 1); i >= 0; i--) {
            let child = parent.children[i];
            console.log(child);
            parent.removeChild(child);
        }
    }else{
        console.log("Error: EmptyParent")
    }
}

function show(word){alert(word)}
