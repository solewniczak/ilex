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
    if (typeof callbacks[msg.Id] === 'function') {
      callbacks[msg.Id](msg);
    }
  };

  that.send = function(action, params, callback) {
    var msg = {
      'Id': id,
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
    ilex.view.console.log(action);
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
  that.action.charAdd = function(tabId, position, character) {
    that.sendAndRecieve('charAdd', {
      'tab': tabId,
      'position': position,
      'character': character,
    },
    {
      'charAdded': function(params) {
      }
    });
  };

  return that;
};
