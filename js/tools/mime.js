'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';
if (ilex.tools.server === undefined)
    throw 'ilex.tools.markup undefined';

ilex.tools.mime = {};

ilex.tools.mime.loadDocument = function (win, documentId) {
  var file = ilex.documents.get(documentId);
  if (ilex.tools.mime.formats[file.format] === undefined) {
    throw 'ilex.tools.mime.loadDocument: undefined file format';
  }
  ilex.tools.mime.formats[file.format].load(win, documentId);
};

//type from mime.formats
ilex.tools.mime.createDocument = function (win, type) {
  if (ilex.tools.mime.formats[type] === undefined) {
    throw 'ilex.tools.mime.createDocument: undefined file format';
  }
  ilex.tools.mime.formats[type].create(win);
};

ilex.tools.mime.formats = {};
ilex.tools.mime.formats['plain text'] = {
  'create': function (win) {
    var name = 'Unititled document';
    ilex.server.createDocument(win.tabId, name, function(documentId) {
      var widget = ilex.widgetsCollection.textWithLinks(win, documentObject);
      win.setContentWidget(widget);
    });
  },
  'load': function (win, documentId) {
    var documentObject = ilex.server.document(win.tabId, documentId),
        widget = ilex.widgetsCollection.textWithLinks(win, documentObject);
    
    win.setContentWidget(widget);
  }
};