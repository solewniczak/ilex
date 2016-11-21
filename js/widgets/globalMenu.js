'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.popupMenu === undefined)
  throw 'ilex.widgetsCollection.popupMenu required by ilex.widgetsCollection.globalMenu';
if (ilex.widgetsCollection.globalMenu !== undefined)
  throw 'ilex.widgetsCollection.globalMenu already defined';


ilex.widgetsCollection.globalMenu = function($parent) {
  var that = {};

  that.button = $('<div class="ilex-globalMenu-button ilex-button">')
                      .css('padding', '3px')
                      .html('<span class="ilex-awesome" style="font-size:20px;">&#xf0c9</span>')
                      .appendTo($parent);
  
  ilex.popupMenu.buttonBind(that.button,
        [
          ['toggleButton',
           function (toggle) {
              ilex.conf.set('nelson mode', toggle);
            },
           'Nelson mode',
           function () { return ilex.conf.get('nelson mode'); }
           ],
          ['separator'],
          ['standardButton', function() {
            window.close();
          }, 'Exit']
        ]);
    
  return that;
}
