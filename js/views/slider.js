'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
    throw 'ilex.widgetsCollection undefined';
if (ilex.views === undefined)
    throw 'ilex.views undefined';

ilex.views.slider = function(canvas) {
  var view = {};

  view.mainSplit = ilex.widgetsCollection.horizontalSplit(ilex.window, [0.85, 0.15]);

  view.fileSelector = ilex.widgetsCollection.verticalFileSelector(view.mainSplit.right);
  
  view.popupNote = ilex.widgetsCollection.popupNote($('body'), 1000);
  
  view.slider = ilex.widgetsCollection.documentsSlider(view.mainSplit.left,
                                                    ilex.widgetsCollection.textStarter);
  
  
  $(document).on('canvasRedraw', function () {
    if (!ilex.navigationMode) {
      return;
    }
    var colorId = 0;
    for (let i = view.slider.windowPointer;
         i < view.slider.windowPointer + view.slider.visibleWindows.get() - 1;
         i += 1) {
      let leftWindow = view.slider.windows.get(i),
          rightWindow = view.slider.windows.get(i + 1);


      if (typeof leftWindow.contentWidget.getFileInfo === 'function' &&
          typeof rightWindow.contentWidget.getFileInfo === 'function') {
        var leftWidget = leftWindow.contentWidget,
            rightWidget = rightWindow.contentWidget,
            leftLinks = leftWidget.getLinks();
        
        if (leftLinks === null) {
          //no links in this window
          continue;
        }
        
        var rightDocumentVersion = rightWidget.getVersion(),
            rightDocumentId = rightWidget.getFileInfo('id');

        for (let link of leftLinks) {
          if (link.secondDocumentId === rightDocumentId &&
             link.secondVersionNo === rightDocumentVersion) {
            var linkId = ilex.linkHash(link),
              $leftSpans = leftWindow.contentWidget.container.find('span.ilex-linkId-'+linkId),
                $rightSpans = rightWindow.contentWidget.container.find('span.ilex-linkId-'+linkId);
            ilex.canvas.drawConnectionSpans($leftSpans, $rightSpans, ilex.tools.colors.htmlToRgba(ilex.linksColors[colorId], 0.8), true);
            colorId = (colorId + 1) % ilex.linksColors.length;
          }
        }
      }
    }

  });
  
  $(document).on('ilex-navigationModeOn', function () {
    $(document).trigger('canvasRedraw');
  });
  
  $(document).on('ilex-navigationModeOff', function () {
    $(document).trigger('canvasRedraw');
    view.popupNote.hide();
  });
  
  
  view.mainSplit.right
    .css('position', 'relative')
    .css('z-index', '100000');
  
  view.mainSplit.handler
    .css('position', 'relative')
    .css('z-index', '100000');

  view.loadDocument = function(winInd, file) {
    if (winInd >= view.slider.windows.length) {
      throw 'window: ' + winInd + ' does not exist';
    }
    var win = view.slider.windows.get(winInd);
    ilex.tools.mime.loadDocument(win, file);
    //.contentWidget.loadText(params)
    ilex.applySize();
  };

  /*Array of view links*/
  view.links = [];
  view.connections = ilex.widgetsCollection.connections($(window), canvas);

  //apply size
  ilex.applySize();

  return view;
};
