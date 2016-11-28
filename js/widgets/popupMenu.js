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
    defaultWidth = 180,
    menuWidth = defaultWidth,
      
    elementLeftMargin = 15,
    elementIconWidth = 15,
    elementAfterIconMargin = 10,
      
    elementLeftIconWidth = 15,
    elementShotrcutLabelWidth  = 80,
      
    elementRightMargin = 10,
      
    elementHeight = 25,
    zIndex = zIndex || 3,
    elements = [];
  

  that.menu = $('<div class="ilex-popupMenu">').appendTo($parentWidget)
                                .css('z-index', zIndex)
                                .css('position', 'absolute')
                                .hide();
  
  
  var createTextElement = function (text) {
     return $('<div>').text(text)
                      .css('text-align', 'left')
                      .css('white-space', 'nowrap')
                      .css('overflow', 'hidden')
                      .css('text-overflow', 'ellipsis');
  }
  
  //params: {
  //      'text': 'text on the button'
  //      'icon': 'html element with button icon'
  //      'leftIcon': 'html element with button left'
  //      'shortcutLabel': 'text of shortcut keys combination'
  //}
  //leftIcon and shortcutLabel cannot be used simultaniously
  var createMenuElement = function (params) {
    var createCell = function (width) {
      var $cell = $('<div>');
      if (width !== undefined) {
        $cell.css('min-width', width);
      }
      return $cell;
    }
    var $elm = $('<div class="ilex-popupMenuElement">')
                  .height(elementHeight)
                  .css('font', '12px IlexSans')
                  .css('line-height', elementHeight+'px')
                  .css('display', 'flex')
                  .width(menuWidth);
  
    createCell(elementLeftMargin).appendTo($elm);
    let $icon_div = createCell(elementIconWidth).appendTo($elm);
    if (params.icon !== undefined) {
      $icon_div.append(params.icon);
    }

    let $afterIconMargin = createCell(elementAfterIconMargin).appendTo($elm);

    let width = menuWidth -
                  elementLeftMargin -
                  elementIconWidth - 
                  elementAfterIconMargin - 
                  elementRightMargin;
    
    if (params.leftIcon !== undefined) {
      let $icon_div = createCell(elementIconWidth);
      $icon_div.append(params.leftIcon);
      $elm.append($icon_div);
      width -= elementLeftIconWidth;
    } else if (params.shortcutLabel !== undefined) {
      let $shortcut_div = createCell(elementShotrcutLabelWidth).appendTo($elm)
                          .text(params.shortcutLabel)
                          .css('text-align', 'right')
                          .css('color', '#999');
      width -= elementShotrcutLabelWidth
    }
    
    if (width < 0) {
      console.log('popupMenu.createMenuElement: menuWidth is too short');
      return null;
    }
    
    createCell(width)
        .append(createTextElement(params.text))
        .insertAfter($afterIconMargin);

    createCell(elementRightMargin).appendTo($elm);

    return $elm;
  };

  
  that.buttons = {};
  //params: {
  //      'text': 'text on the button'
  //      'icon': 'html element with button icon'
  //      'leftIcon': 'html element with button left'
  //      'shortcutLabel': 'text of shortcut keys combination'
  //}
  //leftIcon and shortcutLabel cannot be used simultaniously
  that.buttons.standardButton = function(callback, params) {
    var $elm = createMenuElement(params);
     
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
              .css('border-top', '1px solid #afafaf');
    $div.width(menuWidth).height(5).appendTo($elm);
    
    return $elm;
  };
  
  //params: {
  //      'text': 'text on the button'
  //      'icon': 'html element with button icon'
  //}
  that.buttons.toggleButton = function(callback, params, defaultVal) {
    var toggle;
    if (typeof defaultVal === 'function') {
      toggle = defaultVal();
    } else {
      toggle = defaultVal;
    }
    var $toggle = $('<span class="ilex-awesome">')
                    .css('font-size', '16px');
    
    params.leftIcon = $toggle;
    var $elm = createMenuElement(params);
    
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
  that.createMenuElement = function (elm, width) {
    if (width === undefined) {
      menuWidth = defaultWidth;
    } else {
      menuWidth = width;
    }
    var fn_name = elm[0],
        params = elm.slice(1),
        fn = that.buttons[fn_name];
      if (typeof fn === 'function') {
        let $elm = fn.apply(that, params);
        return $elm;
      }
  };
  
  //elements: ['functin', 'callback', 'function params']
  that.show = function(top, left, elements, width) {
    if (width === undefined) {
      menuWidth = defaultWidth;
    } else {
      menuWidth = width;
    }
    
    if (left > $(window).width() - menuWidth) {
      left = $(window).width() - menuWidth;
    }
    
    that.menu.html('');
    for (let elm of elements) {
      let $elm = that.createMenuElement(elm, width);
      $elm.appendTo(that.menu);
    }
    
    that.menu.css({'top': top, 'left': left}).show();
  };
  
  that.hide = function () {
    that.menu.hide();
    that.menu.html('');
  };
  
  that.buttonBind = function ($button, elements, width) {
    if (width === undefined) {
      menuWidth = defaultWidth;
    } else {
      menuWidth = width;
    }
    
    $button.on('click', function (event) {
      if (that.menu.is(':visible')) {
        that.menu.hide();
      } else {
        var buttonOffset = $button.offset();
        that.show(buttonOffset.top + $button.outerHeight(),
                  buttonOffset.left,
                  elements, width);
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
