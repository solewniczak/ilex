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
    
    $tab.append('<div>tab ' + afterInd + '</div>');
    
    if (afterInd === -1) {
      that.container.append($tab);
    } else {
      that.container.children().eq(afterInd).after($tab);
    }
  };
  
  that.activateTab = function (ind) {
    that.container.children().eq(ind).css('background', '#fff');
  };
  
  $(document).on('ilex-slider-windowAddedAfter', function (event, afterInd, win) {
    that.addTabAfter(afterInd, win);
  });
  
  $(document).on('ilex-slider-tabRemoved', function (event, tabInd) {
    
  });
  
  
  that.container.on('windowResize', function(event) {
    var width = that.container.parent().data('ilex-width'),
      height = that.container.parent().data('ilex-height');
    
    that.container.data('ilex-width', width).data('ilex-height', height);
  });
  
  return that;
};
