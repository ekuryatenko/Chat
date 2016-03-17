"use strict";

/* - комнаты
* - скролинг сообщения
* -
*
* */


//-------window.onload--------
var rooms = ['main','room2','room3'];





//----EVENTS------------------
var sendButton = document.querySelector('#submitmsg');
sendButton.addEventListener('click', function() {
    replaceTextToChat(textField);
});



//----SOCKET EVENTS------------------
var socket = io.connect('http://localhost:3000');

socket.on('connect', function () {
    var userName = prompt("What's your name?");
    writeNameToWrapDiv(userName);
    socket.emit('addUser', userName);
    console.log(userName);
    rooms.push(userName);
});

socket.on('updateChat', function (userName, msg) {
    //console.log('GET UPDATECHAT: ' + msg);
    logToChatBox(userName, msg);
});

socket.on('connect_error', function () {
    logToChatBox("BROWSER", "Connect_error");
});

socket.on('reconnect_failed', function () {
    logToChatBox("BROWSER", "Reconnect_failed");
});


sendButton.onclick = function() {
    var form = document.forms[0];
    var textField = form.elements.usermsg;
    socket.emit('sendMessage', textField.value);
    textField.value = "";
}

console.log("Page loaded");


//----FUNCTIONS-----------------
function logToChatBox(userName, msg){
    document.querySelector('#chatbox').innerHTML += ('<b>'+ userName + ':</b> ' + msg + "<br>");
}

function replaceTextToChat(textField){
    var msg = textField.value;
    textField.value = "";
    logToChatBox(msg);
}

function writeNameToWrapDiv(name){
    document.querySelector('#userName').innerHTML = name;
}

function rewriteRooms(roomsArr, userRoom){
    cleanParent(roomsList);

    for(index of roomsArr){
        if(index == userRoom){//userRoom is inactive
            let newLi = document.createElement('li');
            newLi.innerHTML = index;
            roomsList.appendChild(newLi);
        }else{
            let href = document.createElement('a');
            href.href = "#";
            href.innerHTML = index;
            href.addEventListener('click', function(){alert(href.innerHTML);});

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