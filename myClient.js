"use strict";

/**********************************
 * ACTIVE USER PAGE FIELDS
 *********************************/
// List of chat rooms on the page
var ROOMS_LIST = document.getElementById ("roomsList");
// Field for of chat messages on the page
var CHAT_BOX = document.getElementById ("chatBox");
// Form input field
var TEXT_INPUT = document.getElementById ("userMsg");
// Button to send user messages
var SEND_BUTTON = document.getElementById ("sendMsg");
// Reference to create new user room
var CREATE_NEW_ROOM_HREF = document.getElementById ("createRoom");
// In this field user could see his name and his current active room */
var WRAP_USER_NAME = document.getElementById ("userName");

/**********************************
 * VARIABLES
 *********************************/
var USER_NAME = "";
// Flag for browser-server connection control
var CONNECTION_ERR_FLAG = false;
// Message for server disconnection
const BROWSER_WORD = ('<b style="color:red">' + 'BROWSER' + '</b>');
// Connection to start html page server source
const SERVER_URL = window.location.hostname;

/**
 * Creates socket connection between browser and server
 */
var socket;

while (!isCorrectInput (USER_NAME)) {
	USER_NAME = prompt ("What's your name?");
	if (!isCorrectInput (USER_NAME)) {
		if (!confirm ("Do you want to enter again?")) {
			break;
		}
	} else {
		socket = io.connect (SERVER_URL);
	}
}

/**********************************
 * SOCKET'S RECEIVING EVENTS PART
 *********************************/
/**
 * Fired on initial connection with server
 */
socket.on ('connect', function () {
	CONNECTION_ERR_FLAG = false;

	// Asks server to connect new user to chat
	socket.emit ('addNewUserToChat', USER_NAME);
});

/**
 * Fired to add new message in chat box
 */
socket.on ('updateChat', function (msgObj) {
	logToChatBox (msgObj);
});

/**
 * Fired to initiate CHAT_BOX field by new room messages due to connection
 */
socket.on ('msgArr', function (msgArr) {
	cleanParent (CHAT_BOX);
	// Adds old messages to chatBox
	if (msgArr.length) {
		msgArr.reverse ();
		msgArr.map ((item) => {
			logToChatBox (item);
		});
	}
});

/**
 * Fired to update rooms list for current user page
 */
socket.on ('updateRooms', function (roomsArr, newRoomForUser) {
	// If some other users create new rooms, they appear in rooms list
	if (newRoomForUser == "updateRoomsList") {
		updateRoomsList (roomsArr, socket.curRoom);
	} else {
		//If user has created his room, it's appear in rooms list
		socket.curRoom = newRoomForUser;
		updateRoomsList (roomsArr, newRoomForUser);
		rewriteWrapGreeting (USER_NAME, newRoomForUser);
	}
});

/**
 * Fired upon a disconnection with server
 */
socket.on ('connect_error', function () {
	if (!CONNECTION_ERR_FLAG) {
		// Writes disconnection message in chatbox field
		logToChatBox ({
			user: BROWSER_WORD,
			message: "Connect error"
		});
	}
	CONNECTION_ERR_FLAG = true;
});

/**********************************
 * SOCKET'S SENDING EVENTS PART
 *********************************/
/**
 * Initiates user message sending on SEND_BUTTON click
 */
SEND_BUTTON.onclick = function () {
	/** Parses text of input form */
	socket.emit ('sendMessage', TEXT_INPUT.value);
	TEXT_INPUT.value = "";
};

/**
 * Initiates creation of new room in chat:
 * - user has to click on CREATE_NEW_ROOM_HREF
 * - write name of new room in prompt field
 *
 * Then SERVER connects user with new room
 */
CREATE_NEW_ROOM_HREF.addEventListener ('click', function () {
	let roomName = "";
	while (!isCorrectInput (roomName)) {
		roomName = prompt ("Enter your room name: ");
	}
	socket.emit ('switchUserRoom', roomName);
});

/**
 * Updates rooms list on the page
 * Markes current user room in the list
 * @param roomsArr {Strings array} Full list of chat rooms
 * @param userRoom {String} active room for this user
 */
function updateRoomsList (roomsArr, userRoom) {
	cleanParent (ROOMS_LIST);
	/** Rewrite list due to new roomsArr data */
	for (let item of roomsArr) {
		if (item == userRoom) {
			/** Item for current room isn't active in rooms list */
			let newLi = document.createElement ("li");
			newLi.innerHTML = item;
			ROOMS_LIST.appendChild (newLi);
		} else {
			/** Other rooms items will be active href - click on href switch user to href room */
			let href = document.createElement ("a");
			/** Href dosen't make HTTP calls, it has default value "#" */
			href.href = "#";
			href.innerHTML = item;
			/** Href click calls socket event to switch room from server side */
			href.addEventListener ("click", function () {
				socket.emit ("switchUserRoom", item);
			});
			/** Wrap href into rooms list by li parent */
			let newLi = document.createElement ("li");
			newLi.appendChild (href);
			/** Add li into rooms list */
			ROOMS_LIST.appendChild (newLi);
		}
	}
}

/**********************************
 * FUNCTIONS PART
 *********************************/
/**
 * Checks if user entered valid name value
 * @param {String} value
 */
function isCorrectInput (value) {
	if (value == null) {
		return false;
	} else if (value == "") {
		return false;
	}
	return true;
}


/**
 * Parses and types messages from server in chat box
 * @param msgObj {JSON Object} Message to type in chat field
 */
function logToChatBox (msgObj) {
	var message = document.createElement ('p');

	/** Parses time value from param object and create message string */
	if (msgObj.time !== undefined) {
		var t = new Date (Date.parse (msgObj.time));
		var time = format24 (t);
		message.innerHTML = ('<b>' + time + " - " + msgObj.user + " : " + '</b> ' + msgObj.message + "<br>");
	} else {
		message.innerHTML = ('<b>' + msgObj.user + " : " + '</b> ' + msgObj.message + "<br>");
	}

	CHAT_BOX.appendChild (message);
	/** Sets message to bottom of the external scroll */
	message.scrollIntoView (false);
}

/**
 * Types user greeting phrase on the page with name of current room for user
 * @param userName {String}
 * @param newRoomForUser {String}
 */
function rewriteWrapGreeting (userName, newRoomForUser) {
	WRAP_USER_NAME.innerHTML = (" " + userName + ". You are in " + newRoomForUser + " room.");
}

/**
 * Removes all childrens from param page field (CHAT_BOX, ROOMS_LIST)
 * @param listArr {DOM page object} Should contain some children
 */
function cleanParent (listArr) {
	if (listArr.children.length) {
		for (var i = (listArr.children.length - 1); i >= 0; i--) {
			let child = listArr.children[i];
			listArr.removeChild (child);//!!! тестировать с istArr.pop
		}
	}
}

/**
 * Parses time from date param in 24-hours format
 * @param date {Date}
 * @return strTime {String} "01.12 24:00"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */
function format24 (date) {
	var hours = date.getHours ();
	var minutes = date.getMinutes ();
	minutes = minutes < 10 ? '0' + minutes : minutes;
	var day = date.getDate ();
	//var month = date.toLocaleString('ru', {month: 'long'});
	var month = (date.getMonth () < 10) ? ("0" + (date.getMonth () + 1)) : (date.getMonth () + 1);
	return (day + "." + month + " " + hours + ":" + minutes);
}
