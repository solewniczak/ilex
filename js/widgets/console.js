'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.console !== undefined)
  throw 'ilex.widgetsCollection.console already defined';


ilex.widgetsCollection.console = function ($parentWidget) {
  var that = {},
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height');

  that.container = $('<div class="ilex-resize ilex-console">')
                  .css('overflow', 'auto')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parentWidget.html(that.container);

  that.log = function (msg) {
    let date = new Date();
    that.container.append('<div style="font-size:12px"><span style="color: #ccc">'+date.toLocaleString()+'</span> '+msg+'</div>')
  }

  return that;
}
