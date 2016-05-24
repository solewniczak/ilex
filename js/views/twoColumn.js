'use strict';

//requires:
//ilex.widgetsCollection.horizontalSplit
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
    throw 'ilex.widgetsCollection undefined';

ilex.views.twoColumn = function(canvas) {
  var view = {};
  view.fileSelector = ilex.widgetsCollection.verticalSplit(ilex.window, [0.1, 0.9]);
  view.pannels = ilex.widgetsCollection.horizontalSplit(view.fileSelector.bottom);
  view.leftText = ilex.widgetsCollection.text(view.pannels.left, canvas);
  view.rightText = ilex.widgetsCollection.text(view.pannels.right, canvas);

  view.finishLinkButton = ilex.widgetsCollection
                                      .finishLinkButton(ilex.window,
                                                        view.leftText,
                                                        view.rightText,
                                                        view.pannels.handler);

  //move scrollbar to left
  view.leftText.scrollWindow.css('direction', 'rtl');
  view.leftText.content.css('direction', 'ltr');

  //apply size
  ilex.applySize();

  return view;
};
