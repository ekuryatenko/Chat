"use strict";
const BROWSER_WORD = '<b style="color:red">'+ 'BROWSER' + '</b>';

var userName = "";

//-------window.onload--------
var roomsList = document.getElementById("roomsList");
var connectionErrFlag = false;



//----EVENTS------------------
var sendButton = document.querySelector('#submitmsg');
/*sendButton.addEventListener('click', function() {
 replaceTextToChat(textField);
 });*/

var createRoomHref = document.querySelector('#createRoom');



//----SERVER EVENTS------------------
var socket = io.connect(window.location.hostname);


socket.on('connect', function () {
    connectionErrFlag = false;

    userName = prompt("What's your name?");

    socket.emit('addNewUserToChat', userName);
    console.log(userName);
});


socket.on('updateChat', function (userName, msg) {
    logToChatBox(userName, msg);
});


socket.on('updateRooms', function (roomsArr, newRoomForUser) {
    //some other user creates new room, this room should be added to list
    if(newRoomForUser == "updateRoomsList"){
        rewriteRooms(roomsArr, socket.curRoom);
    }else {
        //this user has created his room, this room should be added to list
        socket.curRoom = newRoomForUser;
        rewriteRooms(roomsArr, newRoomForUser);
        rewriteWrapDiv(userName, newRoomForUser);
    }
});


socket.on('connect_error', function () {
    if(!connectionErrFlag){logToChatBox(BROWSER_WORD, "Connect error");}
    connectionErrFlag = true;
});



//----CLIENT EVENTS------------------
sendButton.onclick = function() {
    var form = document.forms[0];
    var textField = form.elements.usermsg;
    socket.emit('sendMessage', textField.value);
    textField.value = "";
}

createRoomHref.addEventListener('click', function() {
    socket.emit('switchUserRoom', prompt("Enter your room name: "));
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

function rewriteWrapDiv(name, newRoomForUser){
    document.querySelector('#userName').innerHTML = name + ". You are in " + newRoomForUser + " room.";
}

function rewriteRooms(roomsArr, userRoom){
    cleanParent(roomsList);

    for(let index of roomsArr){
        if(index == userRoom){
            //userRoom item is inactive in rooms list
            let newLi = document.createElement('li');
            newLi.innerHTML = index;
            roomsList.appendChild(newLi);
        }else{
            //other rooms are active hrefs, which will send user to this name room
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

function cleanParent(listArr){
    if(listArr.children.length !== 0) {
        for (var i = (listArr.children.length - 1); i >= 0; i--) {
            let child = listArr.children[i];
            listArr.removeChild(child);
        }
    }else{
        console.log("Error: EmptyParent")
    }
}

function show(word){alert(word)}



