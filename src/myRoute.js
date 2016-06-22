"use strict";

/** Establish a connection to the mongo database */
const mongoClient = require ("mongodb").MongoClient;
const uri = require ("./myServer").dbURI;

/** Makes single request to get room history from db
 * @param reply Server reply
 * @param roomToFind {String} room name
 * */
var answer = function (reply, roomToFind) {
	mongoClient.connect (uri, function (err, db) {
		console.log ("SERVER: myRoute has connected to dataBase");

		let collection = db.collection ("messages");

		collection.find ({room: roomToFind}, {_id: 0}).limit (50).sort ({"time": -1}).toArray (function (err, roomMsgs) {
			if (err) throw err;

			reply (JSON.stringify ({roomMsgs}, null, 4));

			db.close ();
		});
	});
};


const serverRoutes = [
	{method: "GET", path: "/", handler: {file: "./views/webPage.html"}},//html
	{method: "GET", path: "/jade", handler: {view: "web.jade"}},//jade
	{method: "GET", path: "/myClient.js", handler: {file: "./myClient.js"}},
	{method: "GET", path: "/myStyle.css", handler: {file: "./views/myStyle.css"}},
	{
		method: "GET", path: "/messages/roomId={roomName}", handler: function (request, reply) {
			answer (reply, request.params.roomName);
		}
	}
];

export {serverRoutes}
