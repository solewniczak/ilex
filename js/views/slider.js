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

  view.mainSplit = ilex.widgetsCollection.horizontalSplit(ilex.window, [0.9, 0.1]);

  view.fileSelector = ilex.widgetsCollection.verticalFileSelector(view.mainSplit.right);

  view.slider = ilex.widgetsCollection.documentsSlider(view.mainSplit.left,
    function (win) {
      return ilex.widgetsCollection.textWithLinks(win, canvas);
  });
  
  
  view.mainSplit.right
    .css('position', 'relative')
    .css('z-index', '100000');
  
  view.mainSplit.handler
    .css('position', 'relative')
    .css('z-index', '100000');

  view.loadText = function(winInd, params) {
    if (winInd >= view.slider.windows.length) {
      throw 'window: ' + winInd + 'does not exist';
    }
    view.slider.windows[winInd].contentWidget.loadText(params);
    ilex.applySize();
  };

  /*Array of view links*/
  view.links = [];
  view.connections = ilex.widgetsCollection.connections($(window), canvas);

  //apply size
  ilex.applySize();

  return view;
};
