/** Establish a connection to the user browser */
import * as SOCKET_IO from 'socket.io';
/** Establish a connection to the mongo database */
import {MongoClient as MONGO_CLIENT} from "mongodb";
/** Global variable for socket.io server */
var IO;
const DB_HOST_URI = "mongodb://heroku_x87klbmn:lt49ivc2vktgbg1dlrtv3ncrhc@ds011271.mlab.com:11271/heroku_x87klbmn";
const DB_LOCAL_URI = "mongodb://localhost:27017/chat";
const DB_URI = DB_LOCAL_URI;

/**
 * Makes main intial server connections
 * @param listener Server for browser processes
 * @param callbackAfterServerRunning Logging support
 */
const initServer = function (listener, callbackAfterServerRunning) {
  MONGO_CLIENT.connect (DB_URI, function (err, db) {
    console.log ("SERVER: connected to dataBase " + db.databaseName);

    IO = SOCKET_IO.listen (listener);

    /** Variables to control rooms and users for current server
     * - roomsList contain all possible rooms in chat
     * - сlientsInRoomQty stores quantity of users in each room
     */
    IO.roomsList = ["MAIN"];
    IO.сlientsInRoomQty = {"MAIN": 0};

    IO.on ("connection", function (socket) {
      chatHandler (socket, db);
    });

    /** Wait for server to boot */
    setTimeout (function () {
      callbackAfterServerRunning ()
    }, 300);
  });
};

export {DB_URI, initServer};

/**
 * Main handler for chat events
 * @param socket
 * @param db
 */
function chatHandler (socket, db) {
  socket.on ("addNewUserToChat", function (username) {
    /** Store the username in the socket session of this client */
    socket.username = username;
    addNewUserToChat (socket);
    sendOldMsgsFromRoom (socket, db);
  });

  socket.on ("sendMessage", function (msg) {
    let newChat_msg = {
      room: socket.curRoom,
      time: new Date (),
      user: socket.username,
      message: (msg)
    };

    /** Emits message to other users in this room */
    IO.sockets.in (socket.curRoom).emit ("updateChat", newChat_msg);

    /** Stores message in db */
    let collection = db.collection ("messages");
    collection.insertOne (newChat_msg);
  });

  socket.on ("switchUserRoom", function (nextRoom) {
    if (isArrayContain (IO.roomsList, nextRoom)) {
      /** User goes to existed room */
      switchToRoom (socket, nextRoom, db);
    } else {
      /** User creates new room and goes there */
      createNewRoom (socket, nextRoom);
      switchToRoom (socket, nextRoom, db);
    }
  });

  socket.on ("disconnect", function () {
    removeUserFromBases (socket, socket.curRoom, db);

    /** Notify users in MAIN room, that this user has disconnected */
    let userLeaveChat_msg = {
      room: "MAIN",
      time: new Date (),
      user: "SERVER",
      message: (socket.username + " HAS LEAVE THIS CHAT")
    };
    IO.emit ("updateChat", userLeaveChat_msg);
  });
}

/**
 * Includes new user to chat
 */
function addNewUserToChat (socket) {
  /** Initially all users are placed into MAIN room */
  socket.curRoom = "MAIN";
  socket.join ("MAIN");
  IO.сlientsInRoomQty["MAIN"]++;

  /** Echo to user, that he is connected to Chat */
  let userJoinToChat_msg = {
    room: "MAIN",
    time: new Date (),
    user: "SERVER",
    message: (socket.username + ", YOU HAVE CONNECTED TO CHAT")
  };
  socket.emit ("updateChat", userJoinToChat_msg);

  /** Send rooms list to this user */
  socket.emit ("updateRooms", IO.roomsList, socket.curRoom);

  /** Notify users in CHAT, that new user has connected */
  let newUserJoinToOurChat_msg = {
    room: "MAIN",
    time: new Date (),
    user: "SERVER",
    message: (socket.username + " HAS CONNECTED TO OUR CHAT")
  };
  IO.emit ("updateChat", newUserJoinToOurChat_msg);

}

/**
 * Sends history of room messages to user due to initial connecting to room
 */
function sendOldMsgsFromRoom (socket, db) {
  /** Chaining makes promises quite useful here  */
  getOldMsgsFromRoom (socket, db).
    then (
      resolve => {
      sendMsgsToUser (socket, resolve);
    },
      reject => {
      throw new Error (reject);
    }
  );
}

/**
 * Calls messages history of current socket room from DB
 */
function getOldMsgsFromRoom (socket, db) {
  return new Promise ((resolve, reject) => {
    let collection = db.collection ("messages");
    collection.find ({room: socket.curRoom}).limit (50).sort ({"time": -1}).toArray (function (err, arr) {
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
  /** Sends messages history array to user */
  socket.emit ("msgArr", msgsArr);

  /** Sends initial welcoming message to user */
  let toNewUserInRoom_msg = {
    room: socket.curRoom,
    time: new Date (),
    user: "SERVER",
    message: (socket.username + ", YOU HAS CONNECTED TO " + socket.curRoom)
  };

  socket.emit ("updateChat", toNewUserInRoom_msg);
}

/**
 * Cheks if item exist in such array
 * @param arr Array for searching
 * @param item Object to search
 */
function isArrayContain (arr, item) {
  return arr.indexOf (item) > -1;
}

/**
 * Switch user to next room
 * @param {String} nextRoom Room where user should be included
 */
function switchToRoom (socket, nextRoom, db) {
  excludeUserFromCurrRoom (socket, db);
  includeUserToNextRoom (socket, nextRoom, db);
}

/**
 * Excludes user from room
 */
function excludeUserFromCurrRoom (socket, db) {
  let userLeaveCurrRoom_msg = {
    room: socket.curRoom,
    time: new Date (),
    user: "SERVER",
    message: (socket.username + " HAS LEAVE OUR ROOM")
  };

  /** Notify other users in this room about user leaving */
  socket.broadcast.to (socket.curRoom).emit ("updateChat", userLeaveCurrRoom_msg);

  removeUserFromBases (socket, socket.curRoom, db);

  socket.leave (socket.curRoom);
}

/**
 * Excludes user's mentions from all arrays and bases
 * @param {String} room Last user room
 */
function removeUserFromBases (socket, room, db) {
  /** Decrements qty of users in this room */
  IO.сlientsInRoomQty[room]--;

  /** Remove empty room from lists and db */
  if ((IO.сlientsInRoomQty[room] === 0) && (room != "MAIN")) {
    removeEmptyRoomFromBases (socket, room, db);
  }
}

/**
 * Removes all data of empty room from IO and DB stores
 * @param {String} room Room to delete from chat
 */
function removeEmptyRoomFromBases (socket, room, db) {
  /** Remove room data from IO stores */
  delete IO.сlientsInRoomQty[room];
  let indexToRemove = IO.roomsList.indexOf (room);
  IO.roomsList.splice (indexToRemove, 1);

  /** Sends new rooms list for all users */
  socket.broadcast.emit ("updateRooms", IO.roomsList, "updateRoomsList");

  /** Remove room data from DB */
  let collection = db.collection ("messages");
  collection.deleteMany ({room: room}, {}, function () {

  });
}

/**
 * Includes user to room
 * @param {String} nextRoom Room where user should be included
 */
function includeUserToNextRoom (socket, nextRoom, db) {
  socket.curRoom = nextRoom;
  socket.join (nextRoom);
  IO.сlientsInRoomQty[nextRoom] += 1;

  let userJoinToRoom_msg = {
    room: nextRoom,
    time: new Date (),
    user: "SERVER",
    message: (socket.username + " HAS CONNECTED TO OUR ROOM")
  };

  /** Notify other users in this room about new user joining */
  socket.broadcast.to (socket.curRoom).emit ("updateChat", userJoinToRoom_msg);

  /** Show this room as active into this user rooms list  */
  socket.emit ("updateRooms", IO.roomsList, nextRoom);

  sendOldMsgsFromRoom (socket, db);
}

/**
 * Creates stores in IO for new room
 * @param {String} room New room in chat
 */
function createNewRoom (socket, newRoom) {
  IO.roomsList.push (newRoom);
  IO.сlientsInRoomQty[newRoom] = 0;

  /** Sends new rooms list, with new room to all users  */
  socket.broadcast.emit ("updateRooms", IO.roomsList, "updateRoomsList");
}
