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
        width = that.button.width(),
        height = that.button.height();
      //if both ranges exisits
      if (ilex.tools.range.filterCollapsed(doc1.selectionRanges).length > 0 &&
          ilex.tools.range.filterCollapsed(doc2.selectionRanges).length > 0) {
        that.button.css('left', handlerOffset.left - width/2);
        that.button.css('top', handlerOffset.top + handler.height()/2 - height/2);
        that.button.show();
      } else {
        that.button.hide();
      }
    };
  //We append not replace parent widget
  //Besouse we are absolute positioning
  that.button = $('<div class="ilex-button ilex-cycle ilex-awesome">&#xf0c1;</div>').appendTo($parentWidget)
                    .css('position', 'absolute')
                    .hide();

  doc1.container.on('selectstart selectend windowResize', show);
  doc2.container.on('selectstart selectend windowResize', show);

  that.button.on('mouseenter mouseleave', function(event) {
    $(document).trigger('canvasRedraw');
  });

  $(document).on('canvasRedraw', function (event) {
    var buttonOffset = that.button.offset(),
      selection = window.getSelection(),
      linksLength = 0;

    if (ilex.view !== undefined && ilex.view.links !== undefined) {
      linksLength = ilex.view.links.length
    }

    if (that.button.filter(':hover').length > 0) {
      //connect evetry part of link with its origins
      for (let elm of
        ilex.tools.range.cartesianOfNotCollapsedRanges(doc1.selectionRanges,
                                                        doc2.selectionRanges)) {
          canvas.drawConnection(elm[0].getClientRects(),
                                elm[1].getClientRects(),
                                //select next avalible color for next connection
                                ilex.linksColors[linksLength %
                                                      ilex.linksColors.length]);
      }
    }
  });

  that.button.on('mouseup', function(event) {
    ilex.tools.connections.createLinkFromRanges(doc1.selectionRanges, doc2.selectionRanges);
    that.button.hide();
  });



  return that;
}
