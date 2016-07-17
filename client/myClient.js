/*************************
 * ACTIVE USER PAGE FIELDS
 *************************/

// List of chat rooms on the page
export const ROOMS_LIST = document.getElementById ("roomsList");

// Field for of chat messages on the page
export const CHAT_BOX = document.getElementById ("chatBox");

// Form input field
export const TEXT_INPUT = document.getElementById ("userMsg");

// Button to send user messages
export const SEND_BUTTON = document.getElementById ("sendMsg");

// Reference to create new user room
export const CREATE_NEW_ROOM_HREF = document.getElementById ("createRoom");

// In this field user could see his name and his current active room
export const WRAP_USER_NAME = document.getElementById ("userName");

/************
 * VARIABLES
 ************/

export let USER_NAME = "";

// Flag for browser-server connection control
export let CONNECTION_ERR_FLAG = [false];

// Message for server disconnection
export const BROWSER_WORD = `<b style="color:red">BROWSER</b>`;

// Connection to start html page server source
export const SERVER_URL = window.location.hostname;

/***************
 * SCRIPT START
 ***************/

// Creates socket connection between browser and server
export var socket = loginUser ();

/****************
 * SOCKET EVENTS
 ****************/

import {
  isCorrectInput,
  onConnect,
  onConnectError,
  onMsgArr,
  onNewRoomHref,
  onSendButton,
  onTextInput,
  onUpdateChat,
  onUpdateRooms
} from "./myClientLib.js";

// Fired on initial connection with server
socket.on ("connect", onConnect);

// Fired to add new message in chat box
socket.on ("updateChat", onUpdateChat);

// Fired to initiate CHAT_BOX field by new room messages due to connection
socket.on ("msgArr", onMsgArr);

// Fired to update rooms list for current user page
socket.on ("updateRooms", onUpdateRooms);

// Fired upon a disconnection with server
socket.on ("connect_error", onConnectError);

/*********************
 * PAGE FIELDS EVENTS
 *********************/

// Initiates user message sending on SEND_BUTTON click
SEND_BUTTON.addEventListener ("click", onSendButton);

// Initiates user message sending on Enter key due to input focus
TEXT_INPUT.addEventListener ("keypress", onTextInput);

// Initiates creation of new room in chat.
CREATE_NEW_ROOM_HREF.addEventListener ("click", onNewRoomHref);

/************
 * FUNCTIONS
 ************/

/**
 * Asks user to input his name in chat
 */
function loginUser () {
  let socket;

  while (!isCorrectInput (USER_NAME)) {
    USER_NAME = prompt ("What is your name?");

    if (!isCorrectInput (USER_NAME)) {
      if (!confirm ("Do you want to enter again?")) {
        socket = io.connect (SERVER_URL);
        socket.disconnect ();
        return socket;
      }
    } else {
      socket = io.connect (SERVER_URL);
      return socket;
    }
  }
}
