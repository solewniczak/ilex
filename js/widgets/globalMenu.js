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
  
  let mainMenu =  [
          ['toggleButton',
           function (toggle) {
              ilex.conf.set('nelson mode', toggle);
            },
           {'text': 'Nelson mode'},
           function () { return ilex.conf.get('nelson mode'); }
           ]
    ];
  
  if (ilex.in_nwjs()) {
    mainMenu.push(
      ['separator'],
      ['standardButton', function() {
          window.close();
        }, {'text': 'Exit', 'shortcutLabel': 'Ctrl+Shift+Q'}]
    );
  }
  
  ilex.popupMenu.buttonBind(that.button, mainMenu, 180);
    
  return that;
}
