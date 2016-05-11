"use strict";
var ilex = {};

ilex.widgets = [];
//widget is object that occupies some part of screen
ilex.widgetsCollection = {};
ilex.widgetsCollection.verticalSplit = function (parentWidget) {
  var that = {},
    handlerHeight = 2,
    height = parentWidget.height() - handlerHeight,
    initialHeight = Math.floor(height/2);

  that.top = $("<div>").appendTo(parentWidget)
                          .width(parentWidget.width())
                          .height(initialHeight);
  that.handler = $("<div>").appendTo(parentWidget)
                          .width(parentWidget.width())
                          .height(handlerHeight)
                          .css("background", "#000");
  that.bottom = $("<div>").appendTo(parentWidget)
                          .width(parentWidget.width())
                          .height(initialHeight);

  return that;
};

ilex.widgetsCollection.horizontalSplit = function (parentWidget) {
  var that = {},
    handlerWidth = 2,
    width = parentWidget.width() - handlerWidth,
    initialWidth = Math.floor(width/2),
    table = $("<div>").appendTo(parentWidget)
                      .css("display", "table-row");

  that.left = $("<div>").appendTo(table)
                          .css("display", "table-cell")
                          .width(initialWidth)
                          .height(parentWidget.height());
  that.handler = $("<div>").appendTo(table)
                          .css("display", "table-cell")
                          .width(handlerWidth)
                          .height(parentWidget.height())
                          .css("background", "#000");
  that.right = $("<div>").appendTo(table)
                          .css("display", "table-cell")
                          .width(initialWidth)
                          .height(parentWidget.height());

  return that;
};

ilex.window = $("<div>").appendTo("body")
                    .width($(document).width())
                    .height($(document).height());

ilex.fileSelector = ilex.widgetsCollection.verticalSplit(ilex.window);
ilex.pannels = ilex.widgetsCollection.horizontalSplit(ilex.fileSelector.bottom);
