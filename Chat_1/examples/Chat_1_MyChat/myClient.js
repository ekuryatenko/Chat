
//window.onload = function() {
    console.log("Page side script started");

    var form = document.forms[0];
    var textField = form.elements.usermsg;



    socket = io.connect('http://localhost:3000');

    socket.on('connect', function () {
        socket.on('chat message', function (msg) {
            document.querySelector('#chatbox').innerHTML += (msg.text. + "<br>");
        });

        console.log("Page is connected to server");

        document.querySelector('#submitmsg').onclick = function() {
            //alert("key pushed");
            socket.emit('message', textField.value);
            textField.value = "";
        }

    });




//};
