'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.blockInput !== undefined)
  throw 'ilex.widgetsCollection.blockInput already defined';


ilex.widgetsCollection.blockInput = function($container, defaultText) {
  if (defaultText === undefined) {
    defaultText = '';
  }
  var that = {};
  //http://stackoverflow.com/questions/6831482/contenteditable-single-line-input
  that.element = $('<div class="ilex-blockInput">').appendTo($container)
                  .attr('contenteditable', 'true')
                  .text(defaultText)
                  .data('ilex-empty', 1)
                  .css('overflow', 'hidden')
                  .css('white-space', 'nowrap')
                  .css('font-size', '12px')
                  .css('color', '#aaa')
                  .css('border', '1px solid #ccc')
                  .css('margin', '5px')
                  .css('margin-top', '0')
                  .css('padding', '2px');
  
  that.element.focus(function () {
    var $this = $(this);
    if ($this.data('ilex-empty') === 1) {
      $this.data('ilex-empty', 0);
      $this.css('color', '#000'); 
      $this.text('');
    }
  });
  
  that.element.blur(function () {
    var $this = $(this);
    if ($this.text() === '') {
      $this.text(defaultText);
      $this.css('color', '#aaa'); 
      $this.data('ilex-empty', 1)
    }
  });
  
  
  that.element.on('keydown', function(event) {
    //Disable Ctrl shortcouts
    if (event.ctrlKey) {
      return false;
    }  
    if (event.key === 'Enter') {
      return false;
    }
  });
  
  that.val = function(val) {
    if (val === undefined) {
       if (that.element.data('ilex-empty') === 1) {
         return '';
       } else {
         return that.element.text();
       }
    } else {
      if (that.element.data('ilex-empty') === 1) {
        that.element.data('ilex-empty', 0);
        that.element.css('color', '#000'); 
      }
      that.element.text(val);
    }
  };
  
  return that;
}
