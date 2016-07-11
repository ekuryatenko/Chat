import {
  ROOMS_LIST,
  CHAT_BOX,
  TEXT_INPUT,
  WRAP_USER_NAME,
  CONNECTION_ERR_FLAG,
  USER_NAME,
  BROWSER_WORD,
  SERVER_URL,
  socket
} from "./myClient.js"

const onConnect = function () {
  CONNECTION_ERR_FLAG[0] = false;
  /** Asks server to connect new user to chat */
  this.emit ("addNewUserToChat", USER_NAME);
};

const onUpdateChat = function (msgObj) {
  logToChatBox (msgObj);
};

const onMsgArr = function (msgArr) {
  cleanParent (CHAT_BOX);
  /** Adds old messages to chatBox */
  if (msgArr.length) {
    msgArr.reverse ();
    msgArr.map ((item) => {
      logToChatBox (item);
    });
  }
};

const onUpdateRooms = function (roomsArr, newRoomForUser) {
  /** If some other users create new rooms, they appear in rooms list */
  if (newRoomForUser == "updateRoomsList") {
    updateRoomsList (roomsArr, this.curRoom);
  } else {
    /** If user has created his room, it's appear in rooms list */
    this.curRoom = newRoomForUser;
    updateRoomsList (roomsArr, newRoomForUser);
    reWriteWrapGreeting (USER_NAME, newRoomForUser);
  }
};

const onConnectError = function () {
  if (!CONNECTION_ERR_FLAG[0]) {
    /** Writes disconnection message in chatbox field */
    logToChatBox ({
      user: BROWSER_WORD,
      message: "Connect error"
    });
  }
  CONNECTION_ERR_FLAG[0] = true;
};

const onSendButton = function () {
  submitText ();
};

const onTextInput = function (event) {
  if (event.keyCode == 13) {
    submitText ();
  }
};

const onNewRoomHref = function () {
  let roomName = "";
  while (!isCorrectInput (roomName)) {
    roomName = prompt ("Enter your room name: ");
    if (!isCorrectInput (roomName)) {
      if (!confirm ("Do you want to enter again?")) {
        return 0;
      }
    } else {
      socket.emit ("switchUserRoom", roomName);
    }
  }
};

export {
  onConnect,
  onUpdateChat,
  onMsgArr,
  onUpdateRooms,
  onConnectError,
  onSendButton,
  onTextInput,
  onNewRoomHref,
  isCorrectInput
}

/**********************************
 * FUNCTIONS PART
 *********************************/
/**
 * Updates rooms list on the page
 * @param roomsArr {Strings array} Full list of chat rooms
 * @param userRoom {String} active room for this user
 */
function updateRoomsList (roomsArr, userRoom) {
  cleanParent (ROOMS_LIST);
  reWriteRoomsList (roomsArr, userRoom);
}

/**
 * Fills rooms list by new values from fooms array
 * Markes current user room in the list
 * @param roomsArr {Strings array} Full list of chat rooms
 * @param userRoom {String} active room for this user
 */
function reWriteRoomsList (roomsArr, userRoom) {
  roomsArr.forEach ((item) => {
    let newLi = document.createElement ("li");
    if (item == userRoom) {
      /** Item for current room isn't active in rooms list */
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
      newLi.appendChild (href);
      /** Add li into rooms list */
      ROOMS_LIST.appendChild (newLi);
    }
  });
}

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
  let message = document.createElement ("p");

  /** Parses time value from param object and create message string */
  if (msgObj.time !== undefined) {
    let time = new Date (Date.parse (msgObj.time));
    time = format24 (time);
    message.innerHTML = "<b>".concat (
      time,
      " - ",
      msgObj.user,
      ": ",
      "</b> ",
      msgObj.message,
      "<br>"
    );
  } else {
    message.innerHTML = ("<b>" + msgObj.user + ": " + "</b> " + msgObj.message + "<br>");
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
function reWriteWrapGreeting (userName, newRoomForUser) {
  WRAP_USER_NAME.innerHTML = (" " + userName + ". You are in " + newRoomForUser + " room.");
}

/**
 * Removes all childrens from param page field (CHAT_BOX, ROOMS_LIST)
 * @param listArr {DOM page object} Should contain some children
 */
function cleanParent (listArr) {
  if (listArr.children.length) {
    for (let i = (listArr.children.length - 1); i >= 0; i--) {
      let child = listArr.children[i];
      listArr.removeChild (child);
    }
  }
}

/**
 * Parses time from date param in 24-hours format
 * @param date {Date}
 * @return {String} "01.12 24:00"
 */
function format24 (date) {
  let hours = date.getHours (),
    minutes = ( date.getMinutes () < 10 ) ? ( "0" + date.getMinutes () ) : ( date.getMinutes () ),
    day = date.getDate (),
    month = ( date.getMonth () < 10 ) ? ( "0" + ( date.getMonth () + 1 ) ) : ( date.getMonth () + 1 );

  return (day + "." + month + " " + hours + ":" + minutes);
}

/**
 * Sends form input text to server
 */
function submitText () {
  /** Parses text from input form */
  socket.emit ("sendMessage", TEXT_INPUT.value);
  TEXT_INPUT.value = "";
}

