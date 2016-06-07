'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.connections !== undefined)
  throw 'ilex.widgetsCollection.connections already defined';

/*draw connections and show follow connection pull-up menus*/
ilex.widgetsCollection.connections = function ($parentWidget, canvas) {
  var that = {};

  $(document).on('canvasRedraw', function (event) {
    if (ilex.view === undefined) {
      return;
    }
    //draw all links
    if (ilex.view.links !== undefined) {
      for (let i = 0; i < ilex.view.links.length; i++) {
        let link = ilex.view.links[i];
        for (let elm of
          ilex.tools.range.cartesianOfNotCollapsedRanges(link.link[0].ranges,
                                                          link.link[1].ranges)) {
            canvas.drawConnection(elm[0].getClientRects(),
                                  elm[1].getClientRects(),
                                  //select next avalible color for next connection
                                  ilex.linksColors[i %
                                                        ilex.linksColors.length]);
        }
      }
    }
    //draw all transclusions
    if (ilex.view.transclusions !== undefined) {
      for (let i = 0; i < ilex.view.transclusions.length; i++) {
        let trans = ilex.view.transclusions[i];
        canvas.drawConnection(trans.left.getClientRects(),
                              trans.right.getClientRects(),
                              ilex.transclusionsColors[i % ilex.transclusionsColors.length],
                              true);
      }
    }
  });

  //jump to connection on right mouse click
  $(document).on('contextmenu', '.ilex-connection', function (event) {
    var $span = $(this),
      links = $span.data('ilex-links'),
      alternate = $span.parents('.ilex-text').data('ilex-alternate'),
      getLinkSpan = function ($parent, id) {
        var $span;
        $parent.find('.ilex-connection').each(function () {
          var thisLinkData = $(this).data('ilex-links');
          for (let link of thisLinkData) {
            if (link.id === id) {
              $span = $(this);
              return;
            }
          }
        });
        return $span;
      };
    //jump immediately
    if (links.length === 1) {
      let id = links[0].id,
        $alternateSpan = getLinkSpan(alternate.content, id),
        $alternateScrollWindow = alternate.scrollWindow;
      if ($alternateSpan !== undefined) {
        let scrollValue = $alternateScrollWindow.scrollTop(),
          distance = $span[0].getBoundingClientRect().top -
                      $alternateSpan[0].getBoundingClientRect().top;
        scrollValue -= distance;
        if (scrollValue < 0)
          scrollValue = 0;
        $alternateScrollWindow.scrollTop(scrollValue);
      }

    //show pull-up menu to choose link
    } else if (links.length > 1) {
      console.log(links);
    }

    event.preventDefault();
  });

  return that;
}
