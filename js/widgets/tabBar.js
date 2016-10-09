'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.tabBar !== undefined)
  throw 'ilex.widgetsCollection.tabBar already defined';

ilex.widgetsCollection.tabBar = function ($parentWidget) {
  var that = {},
      maxTabWidth = 200;
  
  that.container = $('<div class="ilex-resize ilex-tabBar">')
                      .css('display', 'flex');
  $parentWidget.html(that.container);

  that.tabWidth = maxTabWidth;
  
  that.addTabAfter = function(afterInd, windowObject) {
    var buttonWidth = 20;
    //http://stackoverflow.com/questions/5322895/is-there-a-way-to-create-a-chrome-like-tab-using-css
    var $tab = $('<div class="ilex-tab">')
            .width(that.tabWidth)
            .height(170)
            .css('margin', '5px -10px 0')
            .css('background', '#eee')
            .css('font', '12px IlexSans')
            .css('padding', '5px 30px 0 25px')
            .css('border', '1px solid #000')
            .css('border-top-right-radius', '25px 170px')
            .css('border-top-left-radius', '20px 90px');
    
    var $tabText = $('<div class="ilex-tabName">').appendTo($tab)
            .width(that.tabWidth - buttonWidth)
            .css('display', 'inline-block')
            .css('white-space', 'nowrap')
            .css('overflow', 'hidden');
    
    var $closeButton = $('<div class="ilex-closeTabButton">').appendTo($tab)
            .css('float', 'right');
    
    
    $closeButton.html('<span class="ilex-awesome">&#xf00d;</span>');
    $closeButton.on('click', function () {
      $tab.remove();
      windowObject.remove();
    });
    
    if (afterInd === -1) {
      that.container.append($tab);
    } else {
      that.container.children().eq(afterInd).after($tab);
    }
  };
  
  that.setTabName = function (ind, name) {
    that.container.children().eq(ind).find('.ilex-tabName').text(name);
  };
  
  that.activateTab = function (ind) {
    that.container.children().eq(ind);
  };
  
  $(document).on('ilex-slider-windowAddedAfter', function (event, afterInd, win) {
    that.addTabAfter(afterInd, win);
  });
  
  $(document).on('ilex-slider-windowRemoved', function (event, tabInd) {
    
  });
  
  $(document).on('ilex-documentLoaded', function (event, windowObject) {
    var ind = windowObject.getInd(),
        name = windowObject.contentWidget.getFileInfo('name');
    that.setTabName(ind, name);
  });
  
  
  that.container.on('windowResize', function(event) {
    var width = that.container.parent().data('ilex-width'),
      height = that.container.parent().data('ilex-height');
    
    that.container.data('ilex-width', width).data('ilex-height', height);
  });
  
  return that;
};
