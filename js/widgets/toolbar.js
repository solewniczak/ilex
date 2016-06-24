'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.toolbar !== undefined)
  throw 'ilex.widgetsCollection.console already defined';


ilex.widgetsCollection.toolbar = function (dock) {
  var that = {};

  that.toolbar = $('<div class="ilex-toolbar">').appendTo(dock.container);
  that.addButton = function (html, callback) {
    let $button = $('<div class="ilex-button">').html(html);
    $button.on('click', callback);
    this.toolbar.append($button);
    return $button;
  };

  return that;
}
