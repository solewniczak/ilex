'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';
if (ilex.tools.server === undefined)
    throw 'ilex.tools.markup undefined';

ilex.tools.mime = {};

ilex.tools.mime.loadDocument = function (win, documentId, version, callback) {
  var file = ilex.documents.get(documentId);
  if (ilex.tools.mime.formats[file.format] === undefined) {
    throw 'ilex.tools.mime.loadDocument: undefined file format';
  }
  ilex.tools.mime.formats[file.format].load(win, documentId, version, callback);
};

//type from mime.formats
ilex.tools.mime.createDocument = function (win, type, name, content, callback) {
  if (ilex.tools.mime.formats[type] === undefined) {
    throw 'ilex.tools.mime.createDocument: undefined file format';
  }
  ilex.tools.mime.formats[type].create(win, name, content, callback);
};

ilex.tools.mime.formats = {};
ilex.tools.mime.formats['plain text'] = {
  'icon': '<span class="ilex-awesome">&#xf0f6;</span>', //fa-file-text-o
  'create': function (win, name, content, callback) {
    if (callback === undefined) {
      callback = function () {};
    }
    
    var params = {};
    if (name === undefined) {
      params.name = 'Unititled document';
    } else {
      params.name = name;
    }
    if (content === undefined) {
      params.text = '\n';
    } else {
      params.text = content;
    }
    params.class = 'utf-8 encoded text file';
    params.format = 'plain text';
    
    ilex.server.createDocument(win.tabId, params, function(documentObject) {
      var widget = ilex.widgetsCollection.textWithLinks(win, documentObject, 1,
        function () {
          $(document).trigger('ilex-documentLoaded', [win]);
          callback();
        });
      win.setContentWidget(widget);
      ilex.applySize();
    });
  },
  'load': function (win, documentId, version, callback) {
    var documentObject = ilex.server.document(win.tabId, documentId),
        widget = ilex.widgetsCollection.textWithLinks(win, documentObject, version,
          function () {
            if (typeof callback === 'function') {
              callback();
            }
            $(document).trigger('ilex-documentLoaded', [win]);
          });
    
    win.setContentWidget(widget);
    
    ilex.applySize();
  }
};