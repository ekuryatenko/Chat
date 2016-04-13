"use strict";
const BROWSER_WORD = '<b style="color:red">'+ 'BROWSER' + '</b>';

var userName = "";

//-------window.onload--------
var roomsList = document.getElementById("roomsList");
var connectionErrFlag = false;
var chatBox = document.getElementById("chatbox");


//----EVENTS------------------
var sendButton = document.querySelector('#submitmsg');
var createRoomHref = document.querySelector('#createRoom');

//----SERVER EVENTS------------------
var socket = io.connect(window.location.hostname);


socket.on('connect', function () {
    connectionErrFlag = false;

    userName = prompt("What's your name?");

    socket.emit('addNewUserToChat', userName);
    console.log(userName);
});


socket.on('updateChat', function (msgObj) {
    logToChatBox(msgObj);
});

socket.on('msgArr', function (msgArr) {
    cleanParent(chatBox);

    if (msgArr.length) {
        for (var i = (msgArr.length - 1); i > 0; i--) {
            logToChatBox(msgArr[i]);
        }
    }

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
    if(!connectionErrFlag){
        logToChatBox({
            user:BROWSER_WORD,
            message:"Connect error"
            });
    }
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
function logToChatBox(msgObj) {
    var message = document.createElement('p');

    if (msgObj.time !== undefined) {
        var t = new Date(Date.parse(msgObj.time));
        var time = format24(t);
        message.innerHTML = '<b>' + msgObj.user + " - " + time + " : " + '</b> ' + msgObj.message + "<br>";
    }else{
        message.innerHTML = '<b>' + msgObj.user + " : " + '</b> ' + msgObj.message + "<br>";
    }

    document.querySelector('#chatbox').appendChild(message);
    message.scrollIntoView(false);//set message to buttom of the external scroll
}

function rewriteWrapDiv(name, newRoomForUser){
    document.querySelector('#userName').innerHTML = " " + name + ". You are in " + newRoomForUser + " room.";
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


function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function format24(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes;
    return strTime;
}
