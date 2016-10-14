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
  
  var buttonWidth = 20;
  var getStartLeft = function(ind) {
    var outerWidth = that.tabWidth + 20;
    return ind * outerWidth;
  };
  
  that.addTabAfter = function(afterInd, windowObject) {
    
    //http://stackoverflow.com/questions/5322895/is-there-a-way-to-create-a-chrome-like-tab-using-css
    
    var $tab = $('<div class="ilex-tab">')
            .width(that.tabWidth)
            .height(170)
            .css('position', 'absolute')
            .css('left', getStartLeft(afterInd + 1))
            .css('background', '#eee')
            .css('font', '12px IlexSans')
            .css('padding', '10px 30px 0 25px')
            .css('border', '1px solid #000')
            .css('border-top-right-radius', '25px 170px')
            .css('border-top-left-radius', '20px 90px')
            .css('cursor', 'default');
    
    
    $tab.on('mousedown', function () {
      var startX = event.pageX,
          tabStartLeft = $tab.offset().left;
      
      $tab.css('z-index', 2);
      
      $(document).on('mouseup', function () {
        $(document).off('mousemove');
        $(document).off('mouseup');

         $tab.css('z-index', 0);
        $tab.animate({'left': getStartLeft($tab.index())});
      });
      
      var leftOnSwitch = -1,
          swapMargin = 50;
      $(document).on('mousemove', function (event) {
        var delta = event.pageX - startX,
            newTabLeft = tabStartLeft + delta,
            $leftTab = $tab.prev(),
            $rightTab = $tab.next();
        $tab.offset({'left': newTabLeft});
        
        //Zablokuj przełączanie kart dopóki nie przekroczy się granicy tolerancji.
        //Poniższy kod zapobiega migotaniu przy zmianie kart.
         if (leftOnSwitch > -1 &&
             (newTabLeft > leftOnSwitch - swapMargin &&
             newTabLeft < leftOnSwitch + swapMargin)) {
            return;
        }
        leftOnSwitch = -1;
        
        if ($rightTab.length > 0 &&
            !$rightTab.is(':animated') &&
            newTabLeft + $tab.outerWidth() > $rightTab.offset().left + $rightTab.outerWidth() / 2) {
          
          let tabInd = $tab.index(),
              rightTabInd = $rightTab.index();
          
          $tab.insertAfter($rightTab);
          $rightTab.animate({left: getStartLeft($rightTab.index())}, 200);
          
          leftOnSwitch = newTabLeft;
          
          $(document).trigger('ilex-slider-swapWindows', [tabInd, rightTabInd]);
          
        } else if ($leftTab.length > 0 &&
            !$leftTab.is(':animated') &&
            newTabLeft < $leftTab.offset().left + $leftTab.outerWidth() / 2) {
          let tabInd = $tab.index(),
              leftTabInd = $leftTab.index();
          
          $tab.insertBefore($leftTab);
          $leftTab.animate({left: getStartLeft($leftTab.index())}, 200);
          
          leftOnSwitch = newTabLeft;
          
          $(document).trigger('ilex-slider-swapWindows', [tabInd, leftTabInd]);
        }
        
      });
    });
    
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
  
  that.setActiveTabs = function (windowPointer, visibleWindows) {
    that.container.children().css('background', '#eee'); 
    for (let i = windowPointer; i < windowPointer + visibleWindows; i++) {
     that.container.children().eq(i).css('background', '#fff'); 
    }
  };
  
  $(document).on('ilex-slider-windowAddedAfter', function (event, afterInd, win) {
    that.addTabAfter(afterInd, win);
  });
  
  $(document).on('ilex-slider-windowRemoved', function (event, tabInd) {
    
  });
  
  $(document).on('ilex-slider-viewChanged', function (event, windowPointer, visibleWindows) {
    that.setActiveTabs(windowPointer, visibleWindows);
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
