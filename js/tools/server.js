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
      if (response !== undefined && typeof response[msg.action] === 'function') {
        response[msg.action](msg.parameters);
      } else {
        throw 'action: ' + action + ' unknown response: ' + msg.action;
      }
    });
  };

  that.close = function() {
    socket.close();
    socket = null;
  };
  
  //file: allTextInfoRespnonse Object
  that.documentGetDump = function(tabId, documentId, version,
                                    documentRecievedCallback, retrievalFailedCallback) {
    retrievalFailedCallback = retrievalFailedCallback || function() {};
    that.sendAndRecieve('documentGetDump', {
                'text': documentId,
                'version': version,
                'tab': tabId,
              },
              {
                'documentRetrieved': documentRecievedCallback,
                'retrievalFailed': retrievalFailedCallback,
              });
  };
  
  that.tabClose = function(tabId) {
    that.sendAndRecieve('tabClose', {
            'tab': tabId
          },
          {
            'ack': function() {}
          });
  };
    
  that.document = function(tabId, name, documentId) {
    var thatDocument = {}, actionsQueue = [],
        ackRecieve = function (params) {},
        sendAction = function(method, params, callbacks) {
          callbacks = callbacks || {'ack': ackRecieve};
          var action = {'method': method, 'params': params, 'callbacks': callbacks};
          if (documentId === undefined) {
            actionsQueue.push(action);
          } else {
            that.sendAndRecieve(action.method, action.params, callbacks);
          }
        };
    //create new document
    if (documentId === undefined) {
      that.sendAndRecieve('createDocument', {
        'tab': tabId,
        'name': name
      },
      {
        'documentCreated': function(params) {
          documentId = params.id;
          for (let action of actionsQueue) {
            that.sendAndRecieve(action.methos, action.params, action.callbacks);
          }
          actionsQueue = [];
        }
      });
    }
    
    thatDocument.addText = function(position, str) {
      sendAction('documentAddText', {
          'document': documentId,
          'tab': tabId,
          'position': position,
          'string': str,
          'length': str.length
      });
    };
    
    thatDocument.removeText = function(position, length) {
      sendAction('documentRemoveText', {
          'document': documentId,
          'tab': tabId,
          'position': position,
          'length': length
      });
    };
    
    thatDocument.changeName = function(name) {
      sendAction('documentChangeName', {
          'document': documentId,
          'tab': tabId,
          'name': name
      });
    };
    
//    thatDocument.tabClose = function() {
//      sendAction('tabClose', {
//          'document': documentId,
//          'tab': tabId
//      });
//    };
    
    thatDocument.getVersionsInfo = function(callback) {
      sendAction('documentGetVersionsInfo', {
          'document': documentId
      }, {
        'documentVersionsInfoRetrieved': callback
      });
    };
    
    return thatDocument;
  };

  return that;
};
