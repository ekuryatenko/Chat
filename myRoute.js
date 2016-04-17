"use strict";

// Establish a connection to the mongo database
var mongoClient = require('mongodb').MongoClient;

exports.answer = function(reply, roomToFind){
    mongoClient.connect('mongodb://localhost:27017/chat', function (err, db) {
        console.log("FROM ROUTE connected to dataBase: " + db.databaseName);

        var collection = db.collection('messages');

        collection.find({room:roomToFind},{_id:0}).sort({"time": -1}).toArray(function (err, roomMsgs) {
            if (err) throw err;

            reply(JSON.stringify({roomMsgs}, null, 4));

            db.close();
        });
    });
}
