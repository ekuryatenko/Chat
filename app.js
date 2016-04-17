'use strict';
const Path = require('path');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
//const Jade = require('Jade');

const server = new Hapi.Server();
server.connection({ port: process.env.PORT });

//Static files support
server.register(Inert, (err) => {
    if (err) {
        throw err;
    }
});

//Templates support
/*server.register(Vision, (err) => {
    if (err) {
        throw err;
    }

    //Jade enables
    server.views({
        engines: { jade: Jade },
        path: __dirname + '/views',
        compileOptions: {
            pretty: true
        }
    });
});*/


server.route([
    { method: 'GET', path: '/', handler: {file: './views/webPage.html'}},//html
    { method: 'GET', path: '/myClient.js', handler: { file: './myClient.js' } },
    { method: 'GET', path: '/myStyle.css', handler: { file: './views/myStyle.css' } },
    { method: 'GET', path: '/messages/roomId={roomName}', handler:  function (request, reply) {require('./myRoute').answer(reply ,request.params.roomName); } }
    ]
);


server.start((err) => {
    if (err) {
        throw err;
    }

    require('./myServer').initServer(server.listener,function() {
        console.log('Server running at:', server.info.uri);//callback after servers running
    });
});


module.exports = server;


