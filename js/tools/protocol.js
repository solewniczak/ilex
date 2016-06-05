"use strict";

var ilexServer = {};
ilexServer.host = "ws://127.0.0.1:9000/echobot";
ilexServer.socket = null;
ilexServer.init = function (send, recieve) {
	try {
		ilexServer.socket = new WebSocket(ilexServer.host);
		console.log('WebSocket - status '+ilexServer.socket);
		ilexServer.socket.onopen = function(msg) {
							   console.log("Welcome - status ", this.readyState);
                 send();
						   };
		ilexServer.socket.onmessage = function(msg) {
                 recieve(msg.data);
						   };
		ilexServer.socket.onclose = function(msg) {
							   console.log("Disconnected - status ", this.readyState);
						   };
	} catch(ex) {
		console.log(ex);
	}
};

ilexServer.recieve = function (data) {

};

ilexServer.send = function (json) {
	try {
		ilexServer.socket.send(JSON.stringify(json));
		console.log('Sent: ', json);
	} catch(ex) {
		console.log(ex);
	}
};

ilexServer.quit = function () {
  if (ilexServer.socket != null) {
    console.log("Goodbye!");
		ilexServer.socket.close();
		ilexServer.socket = null;
	}
};

ilexServer.reconnect = function () {
	ilexServer.quit();
	ilexServer.init();
};
