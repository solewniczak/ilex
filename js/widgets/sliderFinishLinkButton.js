'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';


ilex.widgetsCollection.sliderFinishLinkButton = function ($parentWidget, documentSlider) {
  var that = {};
  
  var createButton = function (leftWindow, rightWindow) {
    var $button = $('<div class="ilex-finishLinkButton ilex-button ilex-cycle">')
                    .appendTo($parentWidget)
                    .html('<span class="ilex-awesome">&#xf0c1;</span>')
                    .css('position', 'absolute')
                    .css('z-index', 100);
    
//    $button.on('mouseenter mouseleave', function(event) {
//      $(document).trigger('canvasRedraw');
//    });
    
    $button.on('click', function(event) {
      var leftWidget = leftWindow.contentWidget,
          leftId = leftWidget.getFileInfo('id'),
          leftV = leftWidget.getVersion(),
          rightWidget = rightWindow.contentWidget,
          rightId = rightWidget.getFileInfo('id'),
          rightV = rightWidget.getVersion();
      
      console.log(leftId);return;
      
      leftWidget.createHalfLink(rightWindow);
      rightWidget.createHalfLink(leftWindow);
      ilex.server.addLink({
        'id':  leftId,
        'version': leftV,
        'range': {
          'position': leftWidget
        }
      },
      {
        
      })
    });
    
    return $button;
  };
  
  var show = function (event) {      
      //remove old buttons
      $('.ilex-finishLinkButton').remove();
    
      for (let i = 0; i < documentSlider.visibleWindows.get()-1; i++) {
        let wp = documentSlider.windowPointer + i,
            leftWindow = documentSlider.windows.get(wp),
            rightWindow = documentSlider.windows.get(wp + 1),
            $handler = leftWindow.rightSideHandler;
        
        //every window must have contentWidget
//        if (leftWindow.contentWidget === undefined ||
//            rightWindow.contentWidget === undefined) {
//          continue;
//        }
        
        if (leftWindow.contentWidget.canLink() &&
            rightWindow.contentWidget.canLink()) {
          let $button = createButton(leftWindow, rightWindow);
          $button.css('left', $handler.offset().left - $button.width()/2);
          $button.css('top', $handler.offset().top + $handler.height()/2 - $button.height()/2);
        }
      }
    };
  
  $(document).on('ilex-slider-slidingStarted', function () {
    $('.ilex-finishLinkButton').remove();
  });
  $(document).on('ilex-slider-slidingFinished', show);
  $(document).on('ilex-textEditor-selectionchange', show);



  $(document).on('canvasRedraw', function (event) {
//    var buttonOffset = that.button.offset(),
//      selection = window.getSelection(),
//      linksLength = 0;
//
//    if (ilex.view !== undefined && ilex.view.links !== undefined) {
//      linksLength = ilex.view.links.length
//    }
//
//    if (that.button.filter(':hover').length > 0) {
//      //connect evetry part of link with its origins
//      for (let elm of
//        ilex.tools.range.cartesianOfNotCollapsedRanges(doc1.selectionRanges,
//                                                        doc2.selectionRanges)) {
//          canvas.drawConnection(elm[0].getClientRects(),
//                                elm[1].getClientRects(),
//                                //select next avalible color for next connection
//                                ilex.linksColors[linksLength %
//                                                      ilex.linksColors.length]);
//      }
//    }
  });

//  that.button.on('mouseup', function(event) {
//    ilex.tools.connections.createLinkFromRanges(doc1, doc1.selectionRanges, doc2, doc2.selectionRanges);
//    that.button.hide();
//  });



  return that;
}
