'use strict';

//requires:
//ilex.widgetsCollection.horizontalSplit
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
    throw 'ilex.widgetsCollection undefined';

ilex.views.twoColumn = function() {
  var view = {};
  view.fileSelector = ilex.widgetsCollection.verticalSplit(ilex.window, [0.1, 0.9]);
  view.pannels = ilex.widgetsCollection.horizontalSplit(view.fileSelector.bottom);
  view.leftText = ilex.widgetsCollection.text(view.pannels.left);
  view.rightText = ilex.widgetsCollection.text(view.pannels.right);

  //move scrollbar to left
  view.leftText.scrollWindow.css('direction', 'rtl');
  view.leftText.content.css('direction', 'ltr');

  //apply size
  ilex.applySize();


  //create ilex canvas element
  view.canvas = ilex.widgetsCollection.canvas(ilex.window);

  return view;
};
