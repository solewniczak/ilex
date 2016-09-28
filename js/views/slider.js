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

//  view.slider = ilex.widgetsCollection.documentsSlider(view.mainSplit.left,
//    function (win, file) {
//      return ilex.widgetsCollection.textWithLinks(win, canvas, file);
//  });
  
  view.slider = ilex.widgetsCollection.documentsSlider(view.mainSplit.left,
                                                    ilex.widgetsCollection.textStarter);
  
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
