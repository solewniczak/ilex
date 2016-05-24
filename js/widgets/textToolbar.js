'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.textToolbar !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.textToolbar = function ($parentWidget) {
  var that = {},
    addButton = function(that, text, command) {
      var $button = $('<div class="ilex-button">').appendTo(that.toolbar)
                      .text(text);
      $button.on('mousedown', function (event) {
        document.execCommand(command, false, null);
        //prevent focus stealing
        event.preventDefault();
      });
      return $button;
    };
    that.toolbar = $('<div class="ilex-text-toolbar">').appendTo($parentWidget);

    addButton(that, 'Bold', 'bold');
    addButton(that, 'Italic', 'italic');
    addButton(that, 'Underline', 'underline');

    return that;
};
