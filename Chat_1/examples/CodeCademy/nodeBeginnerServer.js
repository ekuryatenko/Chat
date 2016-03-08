var http = require('http');
var url = require('url');
var querystring = require('querystring');
var static = require('node-static');
var file = new static.Server('.', {
    cache: 0
});


function accept(req, res) {

        var pathname = url.parse(req.url).pathname;

        console.log("Server: request for " + pathname + " received.");

        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("Hello World");
        res.end();
        console.log('Server: get request on port 8080, and replied: ' + res.statusCode);

}


// ------ запустить сервер -------

if (!module.parent) {
    http.createServer(accept).listen(8080);
} else {
    exports.accept = accept;
}