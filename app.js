"use strict";
const Path = require ('path');
const Hapi = require ('hapi');
const Inert = require ('inert');
const Vision = require ('vision');
const Jade = require ('Jade');

const server = new Hapi.Server ();
server.connection ({port: process.env.PORT});

//Static files support
server.register (Inert, (err) => {
	if (err) {
		throw err;
	}
});

//Add templates rendering support by vision plugin
server.register (Vision, (err) => {
	if (err) {
		throw err;
	}

	//Jade enables
	server.views ({
		//Register the Jade as responsible for rendering of .jade files
		engines: {
			jade: Jade
		},
		//Show server where templates are located in
		path: __dirname + '/views',
		//For correct page rendering: https://github.com/hapijs/vision#jade
		compileOptions: {
			pretty: true
		}
	});
});


server.route (
	[
		{method: 'GET', path: '/', handler: {file: './views/webPage.html'}},//html
		{method: 'GET', path: '/jade', handler: {view: 'web.jade'}},//jade
		{method: 'GET', path: '/myClient.js', handler: {file: './myClient.js'}},
		{method: 'GET', path: '/myStyle.css', handler: {file: './views/myStyle.css'}},
		{
			method: 'GET', path: '/messages/roomId={roomName}', handler: function (request, reply) {
				require ('./myRoute').answer (reply, request.params.roomName);
			}
		}
	]
);


server.start ((err) => {
	if (err) {
		throw err;
	}

	require ('./myServer').initServer (server.listener, function () {
		//Callback after my server's running
		console.log ('SERVER: app running at ', server.info.uri);
	});
});

module.exports = server;
