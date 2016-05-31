'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';

//doc1, doc2 must have .selectionRange property which indicates currently
//selected part of the document and .container which triggers 'selectend' event
//handler is element on which show finish link button.
//the position of link button will be intersesion of handler and link ray
ilex.widgetsCollection.finishLinkButton = function ($parentWidget, canvas, doc1, doc2, handler) {
  var that = {},
    show = function (event) {
      var handlerOffset = handler.offset(),
        width = that.button.width();
      //if both ranges exisits
      if (doc1.selectionRange.constructor.name === 'Range' &&
          doc2.selectionRange.constructor.name === 'Range') {
        that.button.css('left', handlerOffset.left - width/2);
        that.button.show();
      } else {
        that.button.hide();
      }
    };
  //We append not replace parent widget
  //Besouse we are absolute positioning
  //Unicode Character 'LINK SYMBOL' (U+1F517)
  that.button = $('<div class="ilex-button cycle">🔗</div>').appendTo($parentWidget)
                    .css('position', 'absolute')
                    .css('top', 100)
                    .hide();

  doc1.container.on('selectstart selectend windowResize', show);
  doc2.container.on('selectstart selectend windowResize', show);

  that.button.on('mouseenter mouseleave', function(event) {
    $(document).trigger('canvasRedraw');
  });

  $(document).on('canvasRedraw', function (event) {
    var buttonOffset = that.button.offset(),
      selection = window.getSelection();
    if (that.button.is(':hover')) {
      canvas.drawConnection(doc1.selectionRange.getClientRects(),
                            doc2.selectionRange.getClientRects(),
                            buttonOffset.left);
      selection.removeAllRanges();
    }
  });

  that.button.on('mouseup', function(event) {
    //create Array of links
    if (ilex.view.connections === undefined) {
      ilex.view.connections = [];
    }
    ilex.view.connections.push({'left': doc1.selectionRange, 'right': doc2.selectionRange});
  });

  //draw all connection
  $(document).on('canvasRedraw', function (event) {
    if (ilex.view === undefined || ilex.view.connections === undefined) {
      return;
    }
    for (let con of ilex.view.connections) {
      canvas.drawConnection(con.left.getClientRects(), con.right.getClientRects());
    }
  });

  return that;
}
