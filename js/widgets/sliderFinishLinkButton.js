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
    
    $button.on('mouseenter', function(event) {
      //http://stackoverflow.com/questions/13338484/jquery-trigger-custom-event-synchronously 
      $.when($(document).trigger('canvasRedraw')).then(function () {
        var leftRange = leftWindow.contentWidget.textEditor.selectionRange.get(),
          rightRange = rightWindow.contentWidget.textEditor.selectionRange.get();
        
        //connect evetry part of link with its origins
        ilex.canvas.drawConnection(leftRange.getClientRects(),
                                   rightRange.getClientRects(),
                                  ilex.colorCycle.current(0.6), true);
        ilex.colorCycle.next();
        
      });
    });
    
    $button.on('mouseleave', function(event) {
      $(document).trigger('canvasRedraw');
    });
    
    $button.on('click', function(event) {
      var leftWidget = leftWindow.contentWidget,
          leftId = leftWidget.getFileInfo('id'),
          leftV = leftWidget.getVersion(),
          rightWidget = rightWindow.contentWidget,
          rightId = rightWidget.getFileInfo('id'),
          rightV = rightWidget.getVersion();
      
      var leftRange = leftWidget.textEditor.getSelectionAbsRange(),
          rightRange = rightWidget.textEditor.getSelectionAbsRange();
      ilex.server.addLink({
        'documentId':  leftId,
        'versionNo': leftV,
        'range': leftRange,
        'type': 'H'
      },
      {
        'documentId':  rightId,
        'versionNo': rightV,
        'range': rightRange,
        'type': 'H'
      }, function (msg) {
        var leftMaxVer = leftWidget.getFileInfo('totalVersions'),
            rightMaxVer = rightWidget.getFileInfo('totalVersions');
        
        if (leftMaxVer !== leftV) {
           var leftHalfLink = {
            'documentId': leftId,
            'versionNo': leftV,
            'isLeft': true,
            'lineage': msg.lineage,
            'linkId': msg.linkId,
            'range': leftRange
          };
          
        }
        if (rightMaxVer !== rightV) {
           var rightHalfLink = {
            'documentId': rightId,
            'versionNo': rightV,
            'isLeft': false,
            'lineage': msg.lineage,
            'linkId': msg.linkId,
            'range': rightRange
          };
        }
        if (leftMaxVer !== leftV && rightMaxVer !== rightV) {
          leftWidget.documentLinks.create(leftHalfLink, rightHalfLink);
          rightWidget.documentLinks.create(rightHalfLink, leftHalfLink);
        } else if (leftMaxVer !== leftV) {
          leftWidget.documentLinks.create(leftHalfLink);
        } else if (rightMaxVer !== rightV) {
          rightWidget.documentLinks.create(rightHalfLink);
        }
      });
      leftWidget.textEditor.selectionRange.clear();
      rightWidget.textEditor.selectionRange.clear();
      $button.hide();
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
        //we don't need to check this
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
    
  });

  return that;
}
