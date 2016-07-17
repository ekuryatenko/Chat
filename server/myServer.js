// Establish a connection to the user browser
import SOCKET_IO from "socket.io";

// Establish a connection to the mongo database
import {MongoClient as MONGO_CLIENT} from "mongodb";

// DB constant
const DB_URI = process.env.MONGODB_URI;

// Name for common room in chat
const START_ROOM_NAME = "MAIN";

// Server initiation logging timeout time, ms
const TIME_OUT = 300;

/**
 * Makes main initial server connections.
 * @param {Object} listener - Server for browser processes.
 * @param {callback} callbackAfterServerRunning - Logging support.
 */
const initServer = function (listener, callbackAfterServerRunning) {
  MONGO_CLIENT.connect (DB_URI, (err, db) => {
    if (err) {
      throw new Error (err);
    }

    console.log (`SERVER: connected to dataBase  ${db.databaseName}`);

    // Global variable for socket.io server
    const IO = SOCKET_IO.listen (listener);

    /**
     * Variables to control rooms and users for current chat server.
     */

    // Initial common room for all users
    IO.startRoomName = START_ROOM_NAME;
    // Contains all possible rooms in chat
    IO.roomsList = [START_ROOM_NAME];
    // Store for quantity of users in each room
    IO.сlientsInRoomQty = {};
    IO.сlientsInRoomQty[START_ROOM_NAME] = 0;

    IO.on ("connection", (socket) => {
      // Bind references with socket to transfer globals through modules
      socket.io = IO;
      socket.db = db;
      chatHandler (socket, IO, db);
    });

    // Wait for server to boot
    setTimeout (() => {
      callbackAfterServerRunning ()
    }, TIME_OUT);
  });
};

export {
  DB_URI,
  initServer
};

import {
  onAddToChat,
  onDisconnect,
  onSendMessage,
  onSwitchRoom,
} from "./myServerLib";

/**
 * Main handler for chat events
 * @param {Object} socket
 */
function chatHandler (socket) {
  // Initial connection data exchange
  socket.on ("addNewUserToChat", onAddToChat);

  // Fires when user sends new message to chat
  socket.on ("sendMessage", onSendMessage);

  // Fires when user switches room
  socket.on ("switchUserRoom", onSwitchRoom);

  // Fires on socket disconnection
  socket.on ("disconnect", onDisconnect);
}
