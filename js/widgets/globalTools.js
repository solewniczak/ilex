'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.globalMenu === undefined)
  throw 'ilex.widgetsCollection.popupMenu required by ilex.widgetsCollection.globalMenu';
if (ilex.widgetsCollection.globalTools !== undefined)
  throw 'ilex.widgetsCollection.globalTools already defined';


ilex.widgetsCollection.globalTools = function($parent) {
  var that = {};
  
  that.container = $('<div class="ilex-resize ilex-globalTools">').appendTo($parent)
                      .width($parent.data('ilex-width'))
                      .css('display', 'flex');
                        
   //main menu
  var modesMenu = ilex.widgetsCollection.selectMenu(that.container, [
    {'text': 'Editing', 'icon': '<span class="ilex-awesome">&#xF044;</span>'},
    {'text': 'Viewing', 'icon': '<span class="ilex-awesome">&#xF06E;</span>'}
  ], function (ind) {
    ilex.conf.set('browsing mode', ind);
  },
  ilex.conf.get('browsing mode'));
  
  var menuButton = ilex.widgetsCollection.globalMenu(that.container);
  
  //http://stackoverflow.com/questions/22429003/right-aligning-flex-item
  menuButton.button.css('margin-left', 'auto');
  
  
  that.container.on('windowResize', function(event) {
    var width = that.container.parent().data('ilex-width');
    that.container.data('ilex-width', width);
  });

  return that;
}
