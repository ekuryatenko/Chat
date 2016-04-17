"use strict";

// Establish a connection to the mongo database
var mongoClient = require('mongodb').MongoClient;
var uri = require('./myServer').dbURI;

exports.answer = function(reply, roomToFind){
    mongoClient.connect(uri, function (err, db) {
        console.log("MyROUTE: connected to dataBase");

        var collection = db.collection('messages');

        collection.find({room:roomToFind},{_id:0}).sort({"time": -1}).toArray(function (err, roomMsgs) {
            if (err) throw err;

            reply(JSON.stringify({roomMsgs}, null, 4));

            db.close();
        });
    });
}
