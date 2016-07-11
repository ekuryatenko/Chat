/**********************************
 * ACTIVE USER PAGE FIELDS
 *********************************/
/** List of chat rooms on the page */
export const ROOMS_LIST = document.getElementById ("roomsList");
/** Field for of chat messages on the page */
export const CHAT_BOX = document.getElementById ("chatBox");
/** Form input field*/
export const TEXT_INPUT = document.getElementById ("userMsg");
/** Button to send user messages */
export const SEND_BUTTON = document.getElementById ("sendMsg");
/** Reference to create new user room */
export const CREATE_NEW_ROOM_HREF = document.getElementById ("createRoom");
/** In this field user could see his name and his current active room */
export const WRAP_USER_NAME = document.getElementById ("userName");


/**********************************
 * VARIABLES
 *********************************/
export let USER_NAME = "";
/** Flag for browser-server connection control */
export let CONNECTION_ERR_FLAG = [false];
/** Message for server disconnection */
export const BROWSER_WORD = ('<b style="color:red">' + "BROWSER" + "</b>");
/** Connection to start html page server source */
export const SERVER_URL = window.location.hostname;

/**********************************
 * Script start
 *********************************/
/** Creates socket connection between browser and server  */
export var socket = loginUser();
/** Blocks page to wait for valid user name  */


/**********************************
 * SOCKET EVENTS
 *********************************/
import {onConnect} from "./myClientLib.js";
/** Fired on initial connection with server */
socket.on ("connect", onConnect);

import {onUpdateChat} from "./myClientLib.js";
/** Fired to add new message in chat box */
socket.on ("updateChat", onUpdateChat);

import {onMsgArr} from "./myClientLib.js";
/** Fired to initiate CHAT_BOX field by new room messages due to connection */
socket.on ("msgArr", onMsgArr);


import {onUpdateRooms} from "./myClientLib.js";
/** Fired to update rooms list for current user page */
socket.on ("updateRooms", onUpdateRooms);

import {onConnectError} from "./myClientLib.js";
/** Fired upon a disconnection with server */
socket.on ("connect_error", onConnectError);

import {onSendButton} from "./myClientLib.js";
/** Initiates user message sending on SEND_BUTTON click */
SEND_BUTTON.addEventListener ("click", onSendButton);

import {onTextInput} from "./myClientLib.js";
/** Initiates user message sending on Enter key due to input focus */
TEXT_INPUT.addEventListener ('keypress', onTextInput);

import {onNewRoomHref} from "./myClientLib.js";
/**
 * Initiates creation of new room in chat:
 * - user has to click on CREATE_NEW_ROOM_HREF
 * - user has to write name of new room in prompt field
 * - then SERVER connects user to new room
 */
CREATE_NEW_ROOM_HREF.addEventListener ("click", onNewRoomHref);

import {isCorrectInput} from "./myClientLib.js";
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
    }else{
      socket = io.connect (SERVER_URL);
      return socket;
    }
  }
}
