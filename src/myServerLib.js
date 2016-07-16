const disconnect = function () {
  const socket = this;
  const io = socket.io;
  io.сlientsInRoomQty = socket.сlientsInRoomQty;
  io.roomsList = socket.roomsList;
  const db = socket.db;

  removeUserFromBases (socket, socket.curRoom, io, db);

  /** Notify users in MAIN room, that this user has disconnected */
  const userLeaveChat_msg = {
    room: "MAIN",
    time: new Date (),
    user: "SERVER",
    message: socket.username + " HAS LEAVE THIS CHAT"
  };
  io.emit ("updateChat", userLeaveChat_msg);
};

const addToChat = function (username) {
  const socket = this;
  const io = socket.io;
  io.сlientsInRoomQty = socket.сlientsInRoomQty;
  io.roomsList = socket.roomsList;
  const db = socket.db;

  /** Store the username in the socket session of this client */
  socket.username = username;
  addNewUserToChat (socket, io);
  sendOldMsgsFromRoom (socket, db);
};

const switchRoom = function (nextRoom) {
  const socket = this;
  const io = socket.io;
  io.сlientsInRoomQty = socket.сlientsInRoomQty;
  io.roomsList = socket.roomsList;
  const db = socket.db;

  if (isArrayContain (io.roomsList, nextRoom)) {
    /** User goes to existed room */
    switchToRoom (socket, nextRoom, io, db);
  } else {
    /** User creates new room and goes there */
    createNewRoom (socket, nextRoom, io);
    switchToRoom (socket, nextRoom, io, db);
  }
};

const sendMessage = function (msg) {
  const socket = this;
  const io = socket.io;
  io.сlientsInRoomQty = socket.сlientsInRoomQty;
  io.roomsList = socket.roomsList;
  const db = socket.db;

  var newChat_msg = {
    room: socket.curRoom,
    time: new Date (),
    user: socket.username,
    message: msg
  };
  var collection = void 0;

  /** Emits message to other users in this room */
  io.sockets
    .in (socket.curRoom)
    .emit ("updateChat", newChat_msg);

  /** Stores message in db */
  collection = db.collection ("messages");
  collection.insertOne (newChat_msg);
};

export {
  disconnect,
  addToChat,
  switchRoom,
  sendMessage
}

/**
 * Excludes user's mentions from all arrays and bases
 * @param {String} room Last user room
 */
function removeUserFromBases (socket, room, io, db) {
  /** Decrements qty of users in this room */
  io.сlientsInRoomQty[room]--;

  /** Remove empty room from lists and db */
  if (io.сlientsInRoomQty[room] === 0 && room != "MAIN") {
    removeEmptyRoomFromBases (socket, room, io, db);
  }
}

/**
 * Removes all data of empty room from IO and DB stores
 * @param {String} room Room to delete from chat
 */
function removeEmptyRoomFromBases (socket, room, io, db) {
  var indexToRemove = void 0;
  var collection = void 0;

  /** Remove room data from IO stores */
  delete io.сlientsInRoomQty[room];
  indexToRemove = io.roomsList.indexOf (room);
  io.roomsList.splice (indexToRemove, 1);

  /** Sends new rooms list for all users */
  socket.broadcast.emit ("updateRooms", io.roomsList, "updateRoomsList");

  /** Remove room data from DB */
  collection = db.collection ("messages");
  collection.deleteMany ({room: room}, {}, function () {
  });
}


/**
 * Includes user to room
 * @param {String} nextRoom Room where user should be included
 */
function includeUserToNextRoom (socket, nextRoom, io, db) {
  var userJoinToRoom_msg = void 0;

  socket.curRoom = nextRoom;
  socket.join (nextRoom);
  io.сlientsInRoomQty[nextRoom] += 1;

  userJoinToRoom_msg = {
    room: nextRoom,
    time: new Date (),
    user: "SERVER",
    message: socket.username + " HAS CONNECTED TO OUR ROOM"
  };

  /** Notify other users in this room about new user joining */
  socket.broadcast.to (socket.curRoom).emit ("updateChat", userJoinToRoom_msg);

  /** Show this room as active into this user rooms list  */
  socket.emit ("updateRooms", io.roomsList, nextRoom);

  sendOldMsgsFromRoom (socket, db);
}

/**
 * Creates stores in IO for new room
 * @param newRoom {String} New room in chat
 */
function createNewRoom (socket, newRoom, io) {
  io.roomsList.push (newRoom);
  io.сlientsInRoomQty[newRoom] = 0;

  /** Sends new rooms list, with new room to all users  */
  socket.broadcast.emit ("updateRooms", io.roomsList, "updateRoomsList");
}

function addNewUserToChat (socket, io) {
  var userJoinToChat_msg = void 0;
  var newUserJoinToOurChat_msg = void 0;

  /** Initially all users are placed into MAIN room */
  socket.curRoom = "MAIN";
  socket.join ("MAIN");
  io.сlientsInRoomQty["MAIN"]++;

  /** Echo to user, that he is connected to Chat */
  userJoinToChat_msg = {
    room: "MAIN",
    time: new Date (),
    user: "SERVER",
    message: socket.username + ", YOU HAVE CONNECTED TO CHAT"
  };
  socket.emit ("updateChat", userJoinToChat_msg);

  /** Send rooms list to this user */
  socket.emit ("updateRooms", io.roomsList, socket.curRoom);

  /** Notify users in CHAT, that new user has connected */
  newUserJoinToOurChat_msg = {
    room: "MAIN",
    time: new Date (),
    user: "SERVER",
    message: socket.username + " HAS CONNECTED TO OUR CHAT"
  };
  io.emit ("updateChat", newUserJoinToOurChat_msg);
}

/**
 * Sends history of room messages to user due to initial connecting to room
 */
function sendOldMsgsFromRoom (socket, db) {
  /** Chaining makes promises quite useful here  */
  getOldMsgsFromRoom (socket, db).then (function (resolve) {
    sendMsgsToUser (socket, resolve);
  }, function (reject) {
    throw new Error (reject);
  });
}

/**
 * Calls messages history of current socket room from DB
 */
function getOldMsgsFromRoom (socket, db) {
  return new Promise (function (resolve, reject) {
    var collection = db.collection ("messages");

    collection.find ({room: socket.curRoom})
      .limit (50)
      .sort ({"time": -1})
      .toArray (function (err, arr) {
        resolve (arr);
        reject (err);
    });
  });
}

/**
 * Sends messages history of current socket room to user
 * @param socket
 * @param msgsArr Messages history array
 */
function sendMsgsToUser (socket, msgsArr) {
  var toNewUserInRoom_msg = void 0;

  /** Sends messages history array to user */
  socket.emit ("msgArr", msgsArr);

  /** Sends initial welcoming message to user */
  toNewUserInRoom_msg = {
    room: socket.curRoom,
    time: new Date (),
    user: "SERVER",
    message: socket.username + ", YOU HAS CONNECTED TO " + socket.curRoom
  };

  socket.emit ("updateChat", toNewUserInRoom_msg);
}

/**
 * Checks if item exist in such array
 * @param arr Array for searching
 * @param item Object to search
 */
function isArrayContain (arr, item) {
  return arr.indexOf (item) > -1;
}

/**
 * Switch user to next room
 * @param socket
 * @param nextRoom {String} Room where user should be included
 * @param db
 */
function switchToRoom (socket, nextRoom, io, db) {
  excludeUserFromCurrRoom (socket, io, db);
  includeUserToNextRoom (socket, nextRoom, io, db);
}

/**
 * Excludes user from room
 */
function excludeUserFromCurrRoom (socket, io, db) {
  var userLeaveCurrRoom_msg = {
    room: socket.curRoom,
    time: new Date (),
    user: "SERVER",
    message: socket.username + " HAS LEAVE OUR ROOM"
  };

  /** Notify other users in this room about user leaving */
  socket.broadcast.to (socket.curRoom).emit ("updateChat", userLeaveCurrRoom_msg);

  removeUserFromBases (socket, socket.curRoom, io, db);

  socket.leave (socket.curRoom);
}
