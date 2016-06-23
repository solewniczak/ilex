'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
    throw 'ilex.widgetsCollection undefined';
if (ilex.views === undefined)
    throw 'ilex.views undefined';

ilex.views.twoColumn = function(canvas) {
  var view = {};

  view.topVertical = ilex.widgetsCollection.verticalSplit(ilex.window, [0.1, 0.9]);
  view.bottomVertical = ilex.widgetsCollection.verticalSplit(view.topVertical.bottom, [0.8, 0.2]);

  view.fileSelector = view.topVertical.top;
  view.console = ilex.widgetsCollection.console(view.bottomVertical.bottom);

  view.pannels = ilex.widgetsCollection.horizontalSplit(view.bottomVertical.top);
  view.leftText = ilex.widgetsCollection.text(view.pannels.left, canvas);
  view.rightText = ilex.widgetsCollection.text(view.pannels.right, canvas);

  view.leftText.setAlternateTextWidget(view.rightText);
  view.rightText.setAlternateTextWidget(view.leftText);

  view.leftText.dock.toolbar.setAlternateTextWidget(view.rightText);
  view.rightText.dock.toolbar.setAlternateTextWidget(view.leftText);

  view.finishLinkButton = ilex.widgetsCollection
                                      .finishLinkButton(ilex.window,
                                                        canvas,
                                                        view.leftText,
                                                        view.rightText,
                                                        view.pannels.handler);

  /*Array of view links*/
  view.links = [];
  view.connections = ilex.widgetsCollection.connections($(window), canvas);

  //move scrollbar to left
  view.leftText.scrollWindow.css('direction', 'rtl');
  view.leftText.content.css('direction', 'ltr');

  //create margin for better link presentation
  //view.leftText.content.css('margin-right', '10px');
  //view.rightText.content.css('margin-left', '10px');

  //apply size
  ilex.applySize();

  return view;
};
