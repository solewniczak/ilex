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
    if (msg.notification !== undefined) {
      $(document).trigger('ilex-'+msg.notification, [msg.parameters]);
    } else if (typeof callbacks[msg.id] === 'function') {
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
  
  that.addLink = function(from, to) {
    that.sendAndRecieve('tabClose', {
            'from': from,
            'to': to,
            'type': 'HH'
          },
          {
            'linkCreated': function() {}
          });
  };
	
  that.linkGetLR = function(halfLink, callback) {
	  if (halfLink.isLeft) {
		  var action = 'linkGetRight';
	  } else {
		  var action = 'linkGetLeft';
	  }
	  that.sendAndRecieve(action, {
            'linkId': halfLink.linkId
          },
          {
            'linkGetResponse': function(msg) {
				callback(msg);
			}
	  	  });
  }
  
  that.tabClose = function(tabId) {
    that.sendAndRecieve('tabClose', {
            'tab': tabId
          },
          {
            'ack': function() {}
          });
  };
  
  //createdCallback is launch after document creation
  //createdCallback (document)
  that.createDocument = function(tabId, params, createdCallback) {
      that.sendAndRecieve('createDocument', {
        'tab': tabId,
        'class': params.class || '',
        'format': params.format || '',
        'name': params.name || '',
        'text': params.text || '',
      },
      {
        'documentCreated': function(file) {
          ilex.documents.set(file.id, file);          
          createdCallback(that.document(tabId, file.id));
        }
      });
  };
    
  //object that represents document in tab
  that.document = function(tabId, documentId) {
    var thatDocument = {},
        ackRecieve = function (params) {},
        sendAction = function(method, params, callbacks) {
          callbacks = callbacks || {'ack': ackRecieve};
          var action = {'method': method, 'params': params, 'callbacks': callbacks};
          that.sendAndRecieve(action.method, action.params, callbacks);
        };
    
    thatDocument.getId = function () {
      return documentId;
    };
      
    thatDocument.addText = function(position, str, links) {
      sendAction('documentAddText', {
          'document': documentId,
          'tab': tabId,
          'position': position,
          'string': str,
          'length': str.length,
          'linkIds': links
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
    
    thatDocument.changeName = function(name, callback) {
      sendAction('documentChangeName', {
          'document': documentId,
          'tab': tabId,
          'name': name
      }, {
        'ack': function() {
          var file = ilex.documents.get(documentId);
          file.name = name;
          //change files structure
          ilex.documents.set(documentId, file);
          if (typeof callback === 'function') {
            callback();
          }
        }
      });
    };
    
//    thatDocument.tabClose = function() {
//      sendAction('tabClose', {
//          'document': file.id,
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
