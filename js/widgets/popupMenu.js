'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.popupMenu !== undefined)
  throw 'ilex.widgetsCollection.popupMenu already defined';

ilex.widgetsCollection.popupMenu = function ($parentWidget, zIndex) {
  var that = {},
    menuWidth = 180,
    zIndex = zIndex || 3,
    elements = [];

  that.menu = $('<div class="ilex-popupMenu">').appendTo($parentWidget)
                                .css('z-index', zIndex)
                                .css('position', 'absolute')
                                .hide();
  
  var createMenuElement = function () {
    var $elm = $('<div class="ilex-popupMenuElement">')
                  .css('display', 'flex')
                  .width(menuWidth);
    return $elm;
  };
  
  that.buttons = {};

  that.buttons.standardButton = function(html, onclick) {
    var $elm = $('<div>').html(html).appendTo(that.menu);
    $elm.on('click', function (event) {
      onclick(event);
      that.menu.hide();
      that.clean();
    });
  };
  
  that.buttons.toggleButton = function(html, defaultVal, callback) {
    var toggle;
    if (typeof defaultVal === 'function') {
      toggle = defaultVal();
    } else {
      toggle = defaultVal;
    }
    var $elm = createMenuElement().appendTo(that.menu),
        $text = $('<div>').appendTo($elm).html(html)
                  .width(menuWidth - 40),
        $toggle = $('<div class="ilex-awesome">').appendTo($elm)
                    .css('font-size', '16px');
    var setToggle = function (toggle) {
      if (toggle === false) {
        $toggle.html('&#xf204');
      } else {
        $toggle.html('&#xf205');
      }
    }
    
    setToggle(toggle);
    $elm.on('click', function (event) {
      toggle = !toggle;
      setToggle(toggle);
      callback(toggle);
    });
  };
  
  
  that.show = function(top, left, elements) {
    if (left > $(window).width() - menuWidth) {
      left = $(window).width() - menuWidth;
    }
    
    for (let elm of elements) {
      let fn_name = elm[0],
          params = elm.slice(1),
          fn = that.buttons[fn_name];
      if (typeof fn === 'function') {
        fn.apply(that, params);
      }
    }
    
    that.menu.css({'top': top, 'left': left}).show();
  };
  
  that.hide = function () {
    that.menu.hide();
    that.menu.html('');
  };
  
  that.buttonBind = function ($button, elements) {
    $button.on('click', function (event) {
      if (that.menu.is(':visible')) {
        that.hide(); 
      } else {
        var buttonOffset = $button.offset();
        that.show(buttonOffset.top + $button.outerHeight(),
                  buttonOffset.left,
                  elements);
      }
      event.stopPropagation();
    }); 
  };
  
  $(that.menu).on('click', function (event) {
    event.stopPropagation();
  });
  
  $(document).on('click.ilex-popup', function () {
    if (that.menu.is(':visible')) {
      that.hide();
    }
  });
  


  return that;
};
