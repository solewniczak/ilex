'use strict';

//requires: ilex.widgetsCollection.handlerSize
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.handlerSize === undefined)
  throw 'ilex.widgetsCollection.handlerSize undefined';
if (ilex.widgetsCollection.verticalToolbar !== undefined)
  throw 'ilex.widgetsCollection.verticalToolbar already defined';

//buttons: [Object {'html': String}]
ilex.widgetsCollection.verticalToolbar = function ($parentWidget, buttons) {
  var that = {},
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    buttonHeight = height/buttons.length;

  that.container = $('<div class="ilex-resize ilex-verticalToolbar">')
                  .css('display', 'table')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parentWidget.html(that.container);

  that.buttons = [];
  for (let button of buttons) {
    let buttonCont = $('<div>').css('display', 'table-row').appendTo(that.container),
      buttonElm = $('<div class="ilex-button">').appendTo(buttonCont)
                      .css('display', 'table-cell')
                      //padding of ilex-button is 0 10px
                      //so mimimal width = 20px;
                      .width(width)
                      .height(buttonHeight)
                      .html(button.html);
    //toggle button
    if (button.callback === undefined) {
      buttonElm.data('ilex-state', 'off');
      buttonElm.data('ilex-button', button);
      buttonElm.on('click', function (event) {
        var $buttonElm = $(this),
          button = buttonElm.data('ilex-button');
        if ($buttonElm.data('ilex-state') === 'off') {
          $buttonElm.html(button.htmlOn);
          button.callbackOn();
          $buttonElm.data('ilex-state', 'on');
        } else {
          $buttonElm.html(button.html);
          button.callbackOff();
          $buttonElm.data('ilex-state', 'off');
        }
      });
    } else {
      buttonElm.on('click', button.callback);
    }
    that.buttons.push(buttonElm);
  }
  return that;
};
