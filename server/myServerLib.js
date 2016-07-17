// Limit for chat messages history which new chat user get
const HISTORY_SIZE = 50;

/**
 * Fires on socket disconnection event.
 * Removes this user from chat and notifies chat users
 * about tis user disconnection.
 */
const onDisconnect = function () {
  // With arrows i had undefined instead this, as socket, after transpilling
  const socket = this;
  const io = socket.io;
  const db = socket.db;

  removeUserFromBases (socket, socket.curRoom, io, db);

  // Notify users in MAIN room, that this user has disconnected
  const userLeaveChat_msg = {
    room: io.startRoomName,
    time: new Date (),
    user: "SERVER",
    message: `${socket.username} HAS LEAVE THIS CHAT`
  };

  io.emit ("updateChat", userLeaveChat_msg);
};

/**
 * Fires on initial socket connection to chat.
 * Notifies chat users about new user connection,
 * sends old chat messages to this user.
 * @param {string} username
 */
const onAddToChat = function (username) {
  const socket = this;
  const io = socket.io;
  const db = socket.db;

  // Store the username in the socket session of this client
  socket.username = username;
  addNewUserToChat (socket, io);
  sendOldMsgsFromRoom (socket, db);
};

/**
 * Fires when user create new room to switch in, or when
 * user is going to existing room.
 * @param {string} nextRoom - Room, where user is going.
 */
const onSwitchRoom = function (nextRoom) {
  const socket = this;
  const io = socket.io;
  const db = socket.db;

  if (isArrayContain (io.roomsList, nextRoom)) {
    // User goes to existed room
    switchToRoom (socket, nextRoom, io, db);
  } else {
    // User creates new room and goes there
    createNewRoom (socket, nextRoom, io);
    switchToRoom (socket, nextRoom, io, db);
  }
};

/**
 * Fires when user sends new message to chat.
 * Adds new message to db and distribute it through.
 * all users in chat.
 * @param {string} msg
 */
const onSendMessage = function (msg) {
  const socket = this;
  const io = socket.io;
  const db = socket.db;

  const collection = db.collection ("messages");

  const newChat_msg = {
    room: socket.curRoom,
    time: new Date (),
    user: socket.username,
    message: msg
  };

  // Emits message to other users in this room
  io.sockets
  .in (socket.curRoom)
  .emit ("updateChat", newChat_msg);

  // Stores message in db
  collection.insertOne (newChat_msg);
};

export {
  onAddToChat,
  onDisconnect,
  onSendMessage,
  onSwitchRoom,
}

/**
 * Excludes user's mentions from all chat arrays and bases.
 * @param {Object} socket
 * @param {string} room - Last user room.
 * @param {Object} io
 * @param {Object} db
 */
function removeUserFromBases (socket, room, io, db) {
  // Decrements qty of users in this room
  io.сlientsInRoomQty[room] -= 1;

  // Remove empty room from lists and db
  if (io.сlientsInRoomQty[room] === 0 && room != io.startRoomName) {
    removeEmptyRoomFromBases (socket, room, io, db);
  }
}

/**
 * Removes all data of empty room from IO and DB stores.
 * @param {Object} socket
 * @param {string} room - Room to delete from chat.
 * @param {Object} io
 * @param {Object} db
 */
function removeEmptyRoomFromBases (socket, room, io, db) {
  let indexToRemove;
  const collection = db.collection ("messages");

  // Remove room data from IO stores
  delete io.сlientsInRoomQty[room];
  indexToRemove = io.roomsList.indexOf (room);
  io.roomsList.splice (indexToRemove, 1);

  // Sends new rooms list for all users
  socket.broadcast.emit ("updateRooms", io.roomsList, "updateRoomsList");

  // Remove room data from DB
  collection.deleteMany ({room: room}, {}, () => {
  });
}


/**
 * Includes user to room.
 * @param {Object} socket
 * @param {string} nextRoom - Room where user should be included.
 * @param {Object} io
 * @param {Object} db
 */
function includeUserToNextRoom (socket, nextRoom, io, db) {
  let userJoinToRoom_msg;

  socket.curRoom = nextRoom;
  socket.join (nextRoom);
  io.сlientsInRoomQty[nextRoom] += 1;

  userJoinToRoom_msg = {
    room: nextRoom,
    time: new Date (),
    user: "SERVER",
    message: `${socket.username} HAS CONNECTED TO OUR ROOM`
  };

  // Notify other users in this room about new user joining
  socket.broadcast.to (socket.curRoom).emit ("updateChat", userJoinToRoom_msg);

  // Show this room as active into this user rooms list
  socket.emit ("updateRooms", io.roomsList, nextRoom);

  sendOldMsgsFromRoom (socket, db);
}

/**
 * Creates stores in IO for new room.
 * @param {Object} socket
 * @param {string} newRoom - New room in chat.
 * @param {Object} io
 */
function createNewRoom (socket, newRoom, io) {
  io.roomsList.push (newRoom);
  io.сlientsInRoomQty[newRoom] = 0;

  // Sends new rooms list, with new room to all users
  socket.broadcast.emit ("updateRooms", io.roomsList, "updateRoomsList");
}

/**
 * Adds new user to main chat room.
 * Adds user to chat stores and arrays.
 * Notifies other chat users about new user connection.
 * @param {Object} socket - Socket for new chat user.
 * @param {Object} io
 */
function addNewUserToChat (socket, io) {
  let userJoinToChat_msg;
  let newUserJoinToOurChat_msg;

  // Initially all users are placed into MAIN room
  socket.curRoom = io.startRoomName;
  socket.join (io.startRoomName);
  io.сlientsInRoomQty.MAIN += 1;

  // Echo to user, that he is connected to Chat
  userJoinToChat_msg = {
    room: io.startRoomName,
    time: new Date (),
    user: "SERVER",
    message: `${socket.username}, YOU HAVE CONNECTED TO CHAT`
  };
  socket.emit ("updateChat", userJoinToChat_msg);

  // Send rooms list to this user
  socket.emit ("updateRooms", io.roomsList, socket.curRoom);

  // Notify users in CHAT, that new user has connected
  newUserJoinToOurChat_msg = {
    room: io.startRoomName,
    time: new Date (),
    user: "SERVER",
    message: `${socket.username} HAS CONNECTED TO OUR CHAT`
  };
  io.emit ("updateChat", newUserJoinToOurChat_msg);
}

/**
 * Sends history of room messages to user due to initial
 * connecting to room.
 * @param {Object} socket
 * @param {Object} db
 */
function sendOldMsgsFromRoom (socket, db) {
  // Chaining makes promises quite useful here
  getOldMsgsFromRoom (socket, db).then (function (resolve) {
    sendMsgsToUser (socket, resolve);
  }, (reject) => {
    throw new Error (reject);
  });
}

/**
 * Calls messages history for current socket room from DB.
 * @param {Object} socket
 * @param {Object} db
 */
function getOldMsgsFromRoom (socket, db) {
  return new Promise (function (resolve, reject) {
    const collection = db.collection ("messages");

    collection.find ({room: socket.curRoom})
    .limit (HISTORY_SIZE)
    .sort ({"time": -1})
    .toArray ((err, arr) => {
      resolve (arr);
      reject (err);
    });
  });
}

/**
 * Sends messages history of current socket room to user.
 * @param {Object} socket
 * @param {[JSON]} msgsArr - Messages history array.
 */
function sendMsgsToUser (socket, msgsArr) {
  let toNewUserInRoom_msg;

  // Sends messages history array to user
  socket.emit ("msgArr", msgsArr);

  // Sends initial welcoming message to user
  toNewUserInRoom_msg = {
    room: socket.curRoom,
    time: new Date (),
    user: "SERVER",
    message: `${socket.username}, YOU HAS CONNECTED TO ${socket.curRoom}`
  };

  socket.emit ("updateChat", toNewUserInRoom_msg);
}

/**
 * Checks if item room exist in roomsList array.
 * @param {string[]} arr - roomsList array.
 * @param {string} item - room to search.
 */
function isArrayContain (arr, item) {
  return arr.indexOf (item) > -1;
}

/**
 * Switches user to next room.
 * @param {Object} socket
 * @param {string} nextRoom - Room where user should be included.
 * @param {Object} db
 */
function switchToRoom (socket, nextRoom, io, db) {
  excludeUserFromCurrRoom (socket, io, db);
  includeUserToNextRoom (socket, nextRoom, io, db);
}

/**
 * Excludes user from current socket room.
 * @param {Object} socket
 * @param {Object} io
 * @param {Object} db
 */
function excludeUserFromCurrRoom (socket, io, db) {
  let userLeaveCurrRoom_msg = {
    room: socket.curRoom,
    time: new Date (),
    user: "SERVER",
    message: `${socket.username} HAS LEAVE OUR ROOM`
  };

  // Notify other users in this room about user leaving
  socket.broadcast
  .to (socket.curRoom)
  .emit ("updateChat", userLeaveCurrRoom_msg);

  removeUserFromBases (socket, socket.curRoom, io, db);

  socket.leave (socket.curRoom);
}
