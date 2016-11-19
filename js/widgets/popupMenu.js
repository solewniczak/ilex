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
    elementHeight = 25,
    zIndex = zIndex || 3,
    elements = [];

  that.menu = $('<div class="ilex-popupMenu">').appendTo($parentWidget)
                                .css('z-index', zIndex)
                                .css('position', 'absolute')
                                .hide();
  
  var createMenuElement = function () {
    var $elm = $('<div class="ilex-popupMenuElement">')
                  .height(elementHeight)
                  .css('line-height', elementHeight+'px')
                  .css('display', 'flex')
                  .width(menuWidth);
    $('<div>').width(15).appendTo($elm);
    return $elm;
  };
  
  that.buttons = {};

  that.buttons.standardButton = function(callback, text, icon) {
    var $elm = createMenuElement().append(icon).append('&nbsp;&nbsp;').append(text);
    $elm.on('click', function (event) {
      var ind = $elm.index();
      callback(event, ind);
      that.menu.hide();
    });
    return $elm;
  };
  
  that.buttons.separator = function () {
    var $elm = $('<div>'),
        $div = $('<div>').width(menuWidth).css('background', '#fff');
    $div.clone().height(5).appendTo($elm);
    $div.clone().width(menuWidth).appendTo($elm)
              .css('border-top', '1px solid #000');
    $div.width(menuWidth).height(5).appendTo($elm);
    
    return $elm;
  };
  
  that.buttons.toggleButton = function(callback, text, defaultVal) {
    var toggle;
    if (typeof defaultVal === 'function') {
      toggle = defaultVal();
    } else {
      toggle = defaultVal;
    }
    var $elm = createMenuElement(),
        $text = $('<div>').appendTo($elm).text(text)
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
    
    return $elm;
  };
  
  //elem: ['function', 'callback', 'function params']
  that.createMenuElement = function (elm) {
    var fn_name = elm[0],
        params = elm.slice(1),
        fn = that.buttons[fn_name];
      if (typeof fn === 'function') {
        let $elm = fn.apply(that, params);
        return $elm;
      }
  };
  
  //elements: ['functin', 'callback', 'function params']
  that.show = function(top, left, elements) {
    if (left > $(window).width() - menuWidth) {
      left = $(window).width() - menuWidth;
    }
    
    that.menu.html('');
    for (let elm of elements) {
      let $elm = that.createMenuElement(elm);
      $elm.appendTo(that.menu);
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
        that.menu.hide();
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
      that.menu.hide();
    }
  });
  


  return that;
};
