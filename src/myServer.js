/** Establish a connection to the user browser */
import SOCKET_IO from "socket.io";
/** Establish a connection to the mongo database */
import {MongoClient as MONGO_CLIENT} from "mongodb";
/** Global variable for socket.io server */
var IO;
/** DB constants */
const DB_URI = process.env.MONGODB_URI;

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
      socket.io = IO;
      socket.db = db;
      chatHandler (socket, IO, db);
    });

    /** Wait for server to boot */
    setTimeout (function () {
      callbackAfterServerRunning ()
    }, 300);
  });
};

export {
  DB_URI,
  initServer
};

import {
  disconnect,
  addToChat,
  switchRoom,
  sendMessage,
} from "./myServerLib";

/**
 * Main handler for chat events
 * @param socket
 * @param db
 */
function chatHandler (socket) {
  /** Initial connection data exchange */
  socket.on("addNewUserToChat", addToChat);

  /** Fires when socket sends new message to chat */
  socket.on ("sendMessage", sendMessage);

  /** Fires when user switches room */
  socket.on ("switchUserRoom", switchRoom);

  /** Fires on socket disconnection */
  socket.on ("disconnect", disconnect);
}
