'use strict';

//requires:
//ilex.widgetsCollection.horizontalSplit
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
    throw 'ilex.widgetsCollection undefined';

ilex.views.pannelsTest = function(canvas) {
  var view = {};
  view.v1 = ilex.widgetsCollection.verticalSplit(ilex.window, [0.1, 0.9]);
  view.h1 = ilex.widgetsCollection.horizontalSplit(view.v1.bottom);
  view.h2 = ilex.widgetsCollection.horizontalSplit(view.h1.left);
  view.v2 = ilex.widgetsCollection.verticalSplit(view.h2.left);

  view.leftText = ilex.widgetsCollection.text(view.v2.bottom, canvas);
  view.rightText = ilex.widgetsCollection.text(view.h1.right, canvas);
  view.topText = ilex.widgetsCollection.text(view.v1.top, canvas);
  view.bottomText = ilex.widgetsCollection.text(view.v2.top, canvas);

  //move scrollbar to left
  view.leftText.scrollWindow.css('direction', 'rtl');
  view.leftText.content.css('direction', 'ltr');

  //apply size
  ilex.applySize();

  return view;
};
