'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.tabBar !== undefined)
  throw 'ilex.widgetsCollection.tabBar already defined';

ilex.widgetsCollection.tabBar = function ($parentWidget) {
  var that = {};
  
  that.container = $('<div class="ilex-resize ilex-tabBar">');
  
  that.openTabsContainer = $('<div>').appendTo(that.container)
                      .css('display', 'flex');
  
  var $createNewTabButton = $('<div class="ilex-background-button">')
                      .appendTo(that.container)
                      .width(30).height(18)
                      .css('top', 6)
                      .css('position', 'absolute')   
                      .css('transform', 'skewX(20deg)');
  
  $parentWidget.html(that.container);

  that.tabWidth = function () {
    var maxTabWidth = 200,
        buttonWidth = 20,
        margin = 20;
    
    var width = maxTabWidth;
    return {
      'setLeft': function(new_width) {
        new_width -= buttonWidth + margin;
        if (new_width < maxTabWidth) {
          width = new_width;
        } else {
          width = maxTabWidth;
        }
      },
      //width of tab without close button
      'getInner': function () {
        return width;
      },
      //width of tab with close button
      'getOuter': function () {
        return width + buttonWidth;
      },
      'getLeft': function() {
        return this.getOuter() + margin;
      }
    };
  }();
  
  var addTabButtonLeft = function () {
    var buttonLeft =
        that.openTabsContainer.children().length * that.tabWidth.getLeft() + 30,
        tabBarWidth = that.container.data('ilex-width'),
        buttonMaxLeft = tabBarWidth - 40;
    if (buttonLeft > buttonMaxLeft) {
      buttonLeft = buttonMaxLeft;
    }
    return buttonLeft;
  };
      
  var setTabsLeft = function(animate) {
    var setTabsWidth = function() {
      that.openTabsContainer.children().width(that.tabWidth.getOuter());
      that.openTabsContainer.children().find('.ilex-tabName').width(that.tabWidth.getInner());
    };
    
    var tabBarWidth = that.container.data('ilex-width') - 70,
        nOpenTabs = that.openTabsContainer.children().length;
    
    that.tabWidth.setLeft(tabBarWidth/nOpenTabs);
    setTabsWidth();

    if (animate === undefined) {
      animate = true;
    };
    
    that.openTabsContainer.children().each(function (ind) {
      var $tab = $(this);
      if (animate) {
        $tab.animate({'left': ind * that.tabWidth.getLeft()});
      } else {
        $tab.css({'left': ind * that.tabWidth.getLeft()});
      }
    });
    
    if (animate) {
      $createNewTabButton.animate({'left': addTabButtonLeft()});
    } else {
      $createNewTabButton.css({'left': addTabButtonLeft()});
    }
  };
  
  that.addTabAfter = function(afterInd, windowObject) {
    
    //http://stackoverflow.com/questions/5322895/is-there-a-way-to-create-a-chrome-like-tab-using-css
    
    var $tab = $('<div class="ilex-tab">')
            .width(that.tabWidth.getOuter())
            .height(170)
            .css('position', 'absolute')
            .css('background', '#eee')
            .css('font', '12px IlexSans')
            .css('padding', '10px 30px 0 25px')
            .css('border', '1px solid #000')
            .css('border-top-right-radius', '25px 170px')
            .css('border-top-left-radius', '20px 90px')
            .css('cursor', 'default');
    
    $tab.on('click', function () {
      $(document).trigger('ilex-slider-setWindowPointer', [$tab.index()]);
    });

    $tab.on('mousedown', function () {
      var startX = event.pageX,
          tabStartLeft = $tab.offset().left;
      

      $tab.css('z-index', 2);
      
      $(document).on('mouseup', function () {
        $(document).off('mousemove');
        $(document).off('mouseup');
        
        $createNewTabButton.show();
        $tab.css('z-index', 0);
        
        $tab.animate({'left': $tab.index() * that.tabWidth.getLeft()});
      });
      
      var leftOnSwitch = -1,
          swapMargin = 50;
      $(document).on('mousemove', function (event) {
        $createNewTabButton.hide();
        
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
          $rightTab.animate({left: $rightTab.index() * that.tabWidth.getLeft()}, 200);
          
          leftOnSwitch = newTabLeft;
          
          $(document).trigger('ilex-slider-swapWindows', [tabInd, rightTabInd]);
          
        } else if ($leftTab.length > 0 &&
            !$leftTab.is(':animated') &&
            newTabLeft < $leftTab.offset().left + $leftTab.outerWidth() / 2) {
          let tabInd = $tab.index(),
              leftTabInd = $leftTab.index();
          
          $tab.insertBefore($leftTab);
          $leftTab.animate({left: $leftTab.index() * that.tabWidth.getLeft()}, 200);
          
          leftOnSwitch = newTabLeft;
          
          $(document).trigger('ilex-slider-swapWindows', [tabInd, leftTabInd]);
        }
        
      });
    });
    
    var $tabText = $('<div class="ilex-tabName">').appendTo($tab)
            .text('New tab')
            .width(that.tabWidth.getInner())
            .css('display', 'inline-block')
            .css('white-space', 'nowrap')
            .css('overflow', 'hidden');
    
    var $closeButton = $('<div class="ilex-closeTabButton">').appendTo($tab)
            .css('float', 'right');
    
    
    $closeButton.html('<span class="ilex-awesome">&#xf00d;</span>');
    $closeButton.on('click', function () {
      $tab.remove();
      setTabsLeft();
      windowObject.closeTab();
    });
        
    if (afterInd === -1) {
      that.openTabsContainer.append($tab);
    } else {
      that.openTabsContainer.children().eq(afterInd).after($tab);
    }
    
    setTabsLeft(false);
  };
  
  that.setTabName = function (ind, name) {
    that.openTabsContainer.children().eq(ind).find('.ilex-tabName').text(name);
  };
  
  that.setActiveTabs = function (windowPointer, visibleWindows) {
    that.openTabsContainer.children().css('background', '#eee'); 
    for (let i = windowPointer; i < windowPointer + visibleWindows; i++) {
     that.openTabsContainer.children().eq(i).css('background', '#fff'); 
    }
  };
  
  $(document).on('ilex-slider-windowAddedAfter', function (event, afterInd, win) {
    console.log(afterInd, win);
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
