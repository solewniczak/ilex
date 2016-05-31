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
ilex.widgetsCollection.transcludeButton = function ($parentWidget, canvas, doc1, doc2, handler) {
  var that = {},
    //detects if we have selection for transclusion - one side selected and one
    //collapsed
    collapsedFull = function() {
      var full, collapsed;
      if (doc1.selectionRange.constructor.name === 'Range' &&
          doc2.selectionRange.constructor.name === 'Range') {
        if (doc1.selectionRange.collapsed && !doc2.selectionRange.collapsed) {
          collapsed = doc1.selectionRange;
          full = doc2.selectionRange;
        } else if (!doc1.selectionRange.collapsed && doc2.selectionRange.collapsed) {
          collapsed = doc2.selectionRange;
          full = doc1.selectionRange;
        }
      }
      if (full !== undefined && collapsed !== undefined) {
        return {
                'full': full,
                'collapsed': collapsed
              };
      } else {
        return undefined;
      }
    },
    show = function (event) {
      var handlerOffset = handler.offset(),
        width = that.button.width(),
        selections;
      //if both ranges exisits
      console.log(doc1.selectionRange, doc2.selectionRange);
      selections = collapsedFull()
      if (selections) {
          let r1 = selections.collapsed.getBoundingClientRect(),
            r2 = selections.full.getBoundingClientRect(),
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
  that.button = $('<div class="ilex-button ilex-cycle ilex-awesome">&#xf10d;</div>').appendTo($parentWidget)
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
      connectionsLengt = 0;

    if (ilex.view !== undefined && ilex.view.connections !== undefined) {
      connectionsLengt = ilex.view.connections.length
    }

    if (that.button.is(':hover')) {
      let selections = collapsedFull(),
        transclusinElement = $('<span>').append(selections.full.cloneContents()),
        range = document.createRange();
      selections.collapsed.insertNode(transclusinElement[0]);
      that.button.on('mouseleave', function (event) {
        transclusinElement.remove();
        $(document).trigger('canvasRedraw');
        that.button.off('mouseleave');
      });
      range.selectNode(transclusinElement[0]);

      canvas.drawConnection(selections.full.getClientRects(),
                            range.getClientRects(),
                            //select next avalible color for next connection
                            ilex.contrastColors[connectionsLengt %
                                                  ilex.contrastColors.length]);
      selection.removeAllRanges();
    }
  });

  that.button.on('mouseup', function(event) {
    //create Array of links
    if (ilex.view.connections === undefined) {
      ilex.view.connections = [];
    }
    ilex.view.connections.push({'left': doc1.selectionRange, 'right': doc2.selectionRange});
    that.button.hide();
    //prevent transclusion removal
    that.button.off('mouseleave');
  });

  //draw all connection
  $(document).on('canvasRedraw', function (event) {
    if (ilex.view === undefined || ilex.view.connections === undefined) {
      return;
    }
    let i = 0;
    for (let con of ilex.view.connections) {
      canvas.drawConnection(con.left.getClientRects(),
                            con.right.getClientRects(),
                            ilex.contrastColors[i % ilex.contrastColors.length]);
      i++;
    }
  });

  return that;
}
