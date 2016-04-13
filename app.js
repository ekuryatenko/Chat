'use strict';
const Path = require('path');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Jade = require('Jade');

const server = new Hapi.Server();
server.connection({ port: 3000 });

//Static files support
server.register(Inert, (err) => {
    if (err) {
        throw err;
    }
});

//Templates support
server.register(Vision, (err) => {
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
});


server.route([
    { method: 'GET', path: '/', handler:  function (request, reply) {reply.view('web'); }},//jade template
    { method: 'GET', path: '/html', handler: {file: './views/webPage.html'}},//html
    { method: 'GET', path: '/myClient.js', handler: { file: './myClient.js' } },
    { method: 'GET', path: '/myStyle.css', handler: { file: './views/myStyle.css' } }
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
