// Establish a connection to the mongo database
import {MongoClient as mongoClient} from "mongodb";

import {DB_URI as uri} from "./myServer";

// Limit for messages history size due to history call
const MSGS_QTY = 50;

/**
 * Makes single request to db to get room history.
 * @param {Object} reply - Server reply with JSON of room messages history.
 * @param {string} roomToFind - room name.
 */
const answer = (reply, roomToFind) => {
  mongoClient.connect (uri, (err, db) => {
    if (err) {
      throw err;
    }
    const collection = db.collection ("messages");

    console.log ("SERVER: myRoute sends room history");

    collection.find ({room: roomToFind}, {_id: 0})
    .limit (MSGS_QTY)
    .sort ({"time": -1})
    .toArray ((err2, roomMsgs) => {
      if (err2) {
        throw err2;
      }

      roomMsgs.reverse ();
      const replacer = null,
        space = 4,
        value = {roomMsgs};

      reply (JSON.stringify (value, replacer, space));

      db.close ();
    });
  });
};

// Main routes for app server
const serverRoutes = [
  {
    method: "GET",
    path: "/",
    handler: {
      file: __dirname + "/views/webPage.html"
    }
  },
  {
    method: "GET",
    path: "/pug",
    handler: {
      view: "web.pug"
    }
  },
  {
    method: "GET",
    path: "/boundle.js",
    handler: {
      file: __dirname + "/boundle.js"
    }
  },
  {
    method: "GET",
    path: "/myStyle.css",
    handler: {
      file: __dirname + "/views/myStyle.css"
    }
  },
  {
    method: "GET",
    path: "/messages/roomId={roomName}",
    handler: function (request, reply) {
      answer (reply, request.params.roomName);
    }
  },
  {
    method: "GET",
    path: "/socket.io-1.2.0.js",
    handler: {
      file: __dirname + "/socket.io-1.2.0.js"
    }
  }
];

export {serverRoutes};
