'use strict';

ilex.tools.server = {};

ilex.tools.server.create = function (host) {
  var that = {},
    id = 0,
    //messageQueue BEFORE socket is open
    messageQueue = [],
    //message callbacks
    callbacks = [],
    socket = new WebSocket(host);

  var send = function(msg) {
    console.log('Send: ', msg);
    socket.send(JSON.stringify(msg));
  }

  socket.onopen = function () {
    console.log("Server connected: ", this.readyState);
    for (let msg of messageQueue) {
      send(msg);
    }
    messageQueue = [];
  };

  socket.onmessage = function(event) {
    var msg = JSON.parse(event.data);
    console.log('Recieve: ', msg);
    if (typeof callbacks[msg.id] === 'function') {
      callbacks[msg.id](msg);
    } else {
        throw 'no callback registered for message ' + msg.id.toString();
	}
  };

  that.send = function(action, params, callback) {
    var msg = {
      'id': id,
      'action': action,
      'parameters': params
    };
    if (socket.readyState === 1) {
      send(msg);
    } else {
      messageQueue.push(msg);
    }
    callbacks[id] = callback;
    id += 1;
  };

  //response: [{'action': callback(msg)}]
  that.sendAndRecieve = function(action, params, response) {
    that.send(action, params, function (msg) {
      if (typeof response[msg.action] === 'function') {
        response[msg.action](msg.parameters);
      } else {
        throw 'action: ' + action + ' unknown response: ' + msg.action;
      }
    });
  };

  that.close = function() {
    socket.close();
    socket = null;
  }

  //actions
  that.action = {};
  that.action.documentAddText = function(tabId, position, str) {
    that.sendAndRecieve('documentAddText', {
      'tab': tabId,
      'position': position,
      'string': str,
      'length': str.length
    },
    {
      'documentTextAdded': function(params) {
      }
    });
  };
  
  that.action.documentRemoveText = function(tabId, position, length) {
    that.sendAndRecieve('documentRemoveText', {
      'tab': tabId,
      'position': position,
      'length': length
    },
    {
      'documentTextRemoved': function(params) {
      }
    });
  };

  return that;
};
