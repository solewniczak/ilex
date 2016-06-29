"use strict";

var ilex.tools.protocol = {};
ilex.tools.protocol.host = "ws://127.0.0.1:9000/echobot";
ilex.tools.protocol.socket = null;

ilex.tools.protocol.init = function (openCallback, messageCallback) {
	ilexServer.socket = new WebSocket(ilex.tools.protocol.host);
	console.log('WebSocket - status '+ilex.tools.protocol.socket);
	ilex.tools.protocol.socket.onopen = function(msg) {
						   console.log("Welcome - status ", this.readyState);
               openCallback();
					   };
	ilex.tools.protocol.socket.onmessage = function(msg) {
               messageCallback(msg.data);
					   };
	ilex.tools.protocol.socket.onclose = function(msg) {
						   console.log("Disconnected - status ", this.readyState);
					   };
};

ilex.tools.protocol.send = function (json) {
	ilexServer.socket.send(JSON.stringify(json));
};

ilex.tools.protocol.quit = function () {
  if (ilex.tools.protocol.socket != null) {
		ilex.tools.protocol.socket.close();
		ilex.tools.protocol.socket.socket = null;
	}
};
