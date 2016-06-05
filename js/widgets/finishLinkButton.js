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
          doc2.selectionRange.constructor.name === 'Range' &&
          !doc1.selectionRange.collapsed &&
          !doc2.selectionRange.collapsed) {
        let r1 = doc1.selectionRange.getBoundingClientRect(),
          r2 = doc2.selectionRange.getBoundingClientRect(),
          top, bottom, distance;
        if (r1.top > r2.top) {
          top = r1;
          bottom = r2;
        } else {
          top = r2;
          bottom = r1;
        }
        distance = bottom.top - top.top;

        that.button.css('left', handlerOffset.left - width/2);
        that.button.css('top', top.top + distance/2);
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
      canvas.drawConnection(doc1.selectionRange.getClientRects(),
                            doc2.selectionRange.getClientRects(),
                            //select next avalible color for next connection
                            ilex.linksColors[linksLength %
                                                  ilex.linksColors.length]);
    }
  });

  that.button.on('mouseup', function(event) {
    //link := { 'id': String, 'link':
    //            [ {'span-set': String, 'range': Range},
    //            {'span-set': String, 'range': Range} ] }
    var link;

    //create Array of links
    if (ilex.view.links === undefined) {
      ilex.view.links = [];
    }

    link = {
      'id': 'l'+ilex.view.links.length,
      'link': [
               {'span-set': '', 'range': doc1.selectionRange},
               {'span-set': '', 'range': doc2.selectionRange}
              ]
    };


    ilex.view.links.push(link);
    ilex.tools.markup.addConnectionTag(link);
    that.button.hide();
  });



  return that;
}
