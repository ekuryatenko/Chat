/** Establish a connection to the mongo database */
import {MongoClient as mongoClient} from "mongodb";
import {DB_URI as uri} from "./myServer";

/** Makes single request to db to get room history
 * @param reply Server reply with JSON of room messages history
 * @param roomToFind {String} room name
 */
let answer = function (reply, roomToFind) {
  mongoClient.connect (uri, function (err, db) {
    let collection;

    console.log ("SERVER: myRoute sends room history");

    collection = db.collection ("messages");
    collection.find ({room: roomToFind}, {_id: 0}).limit (50).sort ({"time": -1}).toArray (function (err, roomMsgs) {
      if (err) throw err;

      roomMsgs.reverse ();
      reply (JSON.stringify ({roomMsgs}, null, 4));

      db.close ();
    });
  });
};

/** Main routes for app server */
const serverRoutes = [
  {method: "GET", path: "/", handler: {file: __dirname + "/views/webPage.html"}},
  {method: "GET", path: "/pug", handler: {view: "web.pug"}},
  {method: "GET", path: "/myClient.js", handler: {file: __dirname + "/myClient.js"}},
  {method: "GET", path: "/myStyle.css", handler: {file: __dirname + "/views/myStyle.css"}},
  {
      method: "GET", path: "/messages/roomId={roomName}", handler: function (request, reply) {
        answer (reply, request.params.roomName);
    }
  }
];

export {serverRoutes};
