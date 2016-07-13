import {
  BROWSER_WORD,
  CONNECTION_ERR_FLAG,
  CHAT_BOX,
  ROOMS_LIST,
  SERVER_URL,
  TEXT_INPUT,
  USER_NAME,
  WRAP_USER_NAME,
  socket
} from "./myClient.js"

const onConnect = function () {
  CONNECTION_ERR_FLAG[0] = false;

  // Asks server to connect new user to chat
  this.emit ("addNewUserToChat", USER_NAME);
};

const onUpdateChat = function (msgObj) {
  logToChatBox (msgObj);
};

const onMsgArr = function (msgArr) {
  cleanParent (CHAT_BOX);

  // Adds old messages to chatBox
  if (msgArr.length) {
    msgArr.reverse ();
    msgArr.map ((item) => {
      logToChatBox (item);
    });
  }
};

const onUpdateRooms = function (roomsArr, newRoomForUser) {
  // If some other users create new rooms, they appear in rooms list
  if (newRoomForUser === "updateRoomsList") {
    updateRoomsList (roomsArr, this.curRoom);
  } else {
    // If user has created his room, it's appear in rooms list
    this.curRoom = newRoomForUser;
    updateRoomsList (roomsArr, newRoomForUser);
    reWriteWrapGreeting (USER_NAME, newRoomForUser);
  }
};

const onConnectError = function () {
  if (!CONNECTION_ERR_FLAG[0]) {
    // Writes disconnection message in chatbox field
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

const ENTER_KEY = 13;
const onTextInput = function (event) {
  if (event.keyCode === ENTER_KEY) {
    submitText ();
  }
};

const onNewRoomHref = function () {
  let roomName = "";

  while (!isCorrectInput (roomName)) {
    roomName = prompt ("Enter your room name: ");
    if (isCorrectInput (roomName)) {
      socket.emit ("switchUserRoom", roomName);
    } else {
      if (confirm ("Do you want to enter again?")) {
        // Empty
      } else {
        return 0;
      }
    }
  }
};

export {
  isCorrectInput,
  onConnect,
  onConnectError,
  onMsgArr,
  onNewRoomHref,
  onSendButton,
  onTextInput,
  onUpdateChat,
  onUpdateRooms
}

/*****************
 * FUNCTIONS PART
 *****************/

/**
 * Removes all childrens from param page field (for CHAT_BOX, ROOMS_LIST)
 * @param listArr {DOM object} Should contain some children
 */
function cleanParent (listArr) {
  if (listArr.children.length) {
    for (let idx = listArr.children.length - 1; idx >= 0; idx -= 1) {
      const child = listArr.children[idx];
      listArr.removeChild (child);
    }
  }
}

/**
 * Fills rooms list by new values from rooms array
 * Marks current user room in the list
 * @param roomsArr {[string]} Full list of chat rooms
 * @param userRoom {string} active room for this user
 */
function reWriteRoomsList (roomsArr, userRoom) {
  roomsArr.forEach ((item) => {
    const newLi = document.createElement ("li");

    if (item === userRoom) {
      // Item for current room isn't active in rooms list
      newLi.innerHTML = item;
      ROOMS_LIST.appendChild (newLi);
    } else {
      // Click on href switch user to href room
      const href = document.createElement ("a");

      // Href dosen't make HTTP calls, it has default value "#"
      href.href = "#";
      href.innerHTML = item;

      // Href click calls socket event to switch room from server side
      href.addEventListener ("click", () => {
        socket.emit ("switchUserRoom", item);
      });

      // Wrap href into rooms list by li parent
      newLi.appendChild (href);

      // Add li into rooms list
      ROOMS_LIST.appendChild (newLi);
    }
  });
}

/**
 * Updates rooms list on the page due to new rooms list
 * @param roomsArr {[string]} New full list of chat rooms
 * @param userRoom {string} active room for this user
 */
function updateRoomsList (roomsArr, userRoom) {
  cleanParent (ROOMS_LIST);
  reWriteRoomsList (roomsArr, userRoom);
}

/**
 * Checks if user entered valid name value
 * @param {string} value
 */
function isCorrectInput (value) {
  if (value === null) {
    return false;
  } else if (value === "") {
    return false;
  }

  return true;
}

/**
 * Parses and types messages from server in chat box
 * @param msgObj {JSON Object} Message to type in chat field
 */
function logToChatBox (msgObj) {
  const message = document.createElement ("p");

  // Parses time value from param object and create message string
  if (msgObj.time === undefined) {
    message.innerHTML = `<b>${msgObj.user}
    : </b>${msgObj.message}<br>`;
  } else {
    let time = new Date (Date.parse (msgObj.time));

    time = format24 (time);
    message.innerHTML = `<b>${time} - ${msgObj.user}
    : </b>${msgObj.message}<br>`;
  }
  CHAT_BOX.appendChild (message);

  // Sets message to bottom of the external scroll
  message.scrollIntoView (false);
}

/**
 * Types user greeting phrase on the page with name of current room for user
 * @param userName {String}
 * @param newRoomForUser {String}
 */
function reWriteWrapGreeting (userName, newRoomForUser) {
  WRAP_USER_NAME.innerHTML = ` ${userName}. You are in
  ${newRoomForUser}  room.`;
}


/**
 * Parses time from date param in 24-hours format
 * @param date {Date}
 * @return {String} "01.12 24:00"
 */
function format24 (date) {
  const hours = date.getHours ();
  const minutes = (date.getMinutes () < 10) ? `0${date.getMinutes ()}` : date.getMinutes ();
  const day = date.getDate ();
  const month = (date.getMonth () < 10) ? `0${(date.getMonth () + 1)}` : date.getMonth () + 1;

  return `${day}.${month} ${hours}:${minutes}`;
}

/**
 * Sends form input text to server
 */
function submitText () {
  // Parses text from input form
  socket.emit ("sendMessage", TEXT_INPUT.value);
  TEXT_INPUT.value = "";
}

