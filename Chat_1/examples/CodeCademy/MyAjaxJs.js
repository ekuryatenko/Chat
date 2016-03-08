function sum() {
   var cnt = 0;
    for(var key = 0; key < arguments.length; key++){
        cnt += arguments[key];
    }
    return cnt;
}

//alert( sum(1,3,5));

function buttonEvent() {

    alert("START SENDING");
    var xhr = new XMLHttpRequest();

    xhr.open('GET', 'http://www.ajax-tutor.com/301/jquery-basics', true);
    alert(xhr.toString);
    writeTextToPage(xhr.readyState);

    xhr.onreadystatechange = function() {
        writeTextToPage(xhr.readyState + " I got: " + xhr.responseType);
    };

    xhr.send();

/*    alert("START SENDING");
    var xhr;
    if (window.XMLHttpRequest){
        alert("XMLHttpRequest build");
        xhr = new XMLHttpRequest();
    }    else if (window.ActiveXObject) {
        alert("XMLHttpRequest build");
        xhr = new ActiveXObject("Msxml2.XMLHTTP");
    }
    else
        throw new Error("Ajax is not supported by your browser");
    // 1. Instantiate XHR - End

    // 2. Handle Response from Server - Start
    xhr.onreadystatechange = function () {
        if (xhr.readyState < 4)
            writeTextToPage("Loading...");
        else if (xhr.readyState === 4) {
            if (xhr.status == 200 && xhr.status < 300)
                writeTextToPage(xhr.responseText);
        }
    }
    // 2. Handle Response from Server - End

    // 3. Specify your action, location and Send to the server - Start
    xhr.open('GET', 'http://www.ajax-tutor.com/demo/data1.html');
    xhr.send(null);*/




};

function writeTextToPage(text) {
    var li = log.appendChild(document.createElement('li'));
    li.innerHTML = text;
}


