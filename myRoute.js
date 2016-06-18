"use strict";

// Establish a connection to the mongo database
var mongoClient = require ('mongodb').MongoClient;
var uri = require ('./myServer').dbURI;

/** Makes single request to get room history from db
 * @param reply Server reply
 * @param roomToFind {String} room name
 * */
exports.answer = function (reply, roomToFind) {
	mongoClient.connect (uri, function (err, db) {
		console.log ("SERVER: myRoute has connected to dataBase");

		var collection = db.collection ('messages');

		collection.find ({room: roomToFind}, {_id: 0}).limit (50).sort ({"time": -1}).toArray (function (err, roomMsgs) {
			if (err) throw err;

			reply (JSON.stringify ({roomMsgs}, null, 4));

			db.close ();
		});
	});
};
