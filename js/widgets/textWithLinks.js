'use strict';

//requires: ilex.canvas
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.text !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.textWithLinks = function(windowObject, canvas) {
  var that = {},
    width = windowObject.element.data('ilex-width'),
    height = windowObject.element.data('ilex-height');
  
  that.container = $('<div class="ilex-resize ilex-textWithLinks">')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  windowObject.widget.html(that.container);

  that.dock = {};
  that.dock.container = $('<div class="ilex-dock">').appendTo(that.container)
                          .data('ilex-width', width);
                          //height depends on button's sizes
  
  //add toolbar at the end to give it access to entre text object
  //that.dock.toolbar = ilex.widgetsCollection.textToolbar(that.dock.container, that, canvas);
  that.dock.titleToolbar = ilex.widgetsCollection.toolbar(that.dock);
  that.dock.toolbar = ilex.widgetsCollection.toolbar(that.dock);
  

  
  that.textEditor = ilex.widgetsCollection.textEdiotr(that.container, canvas);
  
  that.textEditor.content.on('documentAddText', function(event, data) {
    that.document.addText(data.absStart - 1, data.value);
  });
  
  that.textEditor.content.on('documentRemoveText', function(event, data) {
    that.document.removeText(data.absStart, data.length);
  });
  
  that.dock.toolbar.addButton('Link', function () {
    let $spans = that.textEditor.getSelectionSpans();
    $spans.css('text-decoration', 'underline').css('color', 'blue');
  });
  
  that.document = null;
  that.loadText = function (params) {
    that.document = ilex.server.document(windowObject.tabId, params.name, params.id);
    for (let line of params.text.split('\n')) {
      let $line = that.textEditor.textDocument.insertLineAfter();
      //that.textEditor.textDocument.insertText($line.find("span"), 0, line + "\n");
      $line.find("span").text(line + '\n');
    }
  };
  
  that.container.on('windowResize', function(event) {
    var width = windowObject.element.data('ilex-width'),
      height = windowObject.element.data('ilex-height');

      that.container.data('ilex-width', width);
      //that.dock.container.data('ilex-width', width);
    
      that.container.data('ilex-height', height);
      //dock conatiner height does not choange
      //content height shrinks
      //that.content.data('ilex-height', height - that.dock.container.height());
  });
  return that;
};