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

  that.container = $('<div class="ilex-toolbar">').appendTo(dock.container);
  that.addButton = function (html, callback, alternateCallback) {
    let $button = $('<div class="ilex-button ilex-rect-button">').html(html);
    if (alternateCallback === undefined) {
      $button.on('click', callback);
    } else {
      var buttonState = 'off';
      $button.on('click', function (event) {
        if (buttonState === 'off') {
          callback(this);
          buttonState = 'on';
        } else {
          alternateCallback(this);
          buttonState = 'off';
        }
      })
    }
    this.container.append($button);
    return $button;
  };

  return that;
}
