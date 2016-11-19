'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.popupMenu === undefined)
  throw 'ilex.widgetsCollection.popupMenu required by ilex.widgetsCollection.modesMenu';
if (ilex.widgetsCollection.selectMenu !== undefined)
  throw 'ilex.widgetsCollection.selectMenu already defined';


ilex.widgetsCollection.selectMenu = function($parent, elements, callback, selected, width) {
  if (selected === undefined) {
    selected = 0;
  }
  if (width === undefined) {
    width = 160;
  }
  
  var that = {},
      selectHeight = 25,
      buttonWidth = 20,
      elementWidth = width - buttonWidth;
  
  var $selectedOption = $('<div>').width(elementWidth)
                          .css('overflow', 'hidden');
  
  var $caretButton = $('<div class="ilex-awesome">&#xf0d7</div>')//carret down
                      .width(buttonWidth)
                      .css('line-height', selectHeight+'px')
                      .css('font-size', '10px')
                      .css('text-align', 'center')
                      .css('vertical-align', 'middle');
  
  that.button = $('<div class="ilex-selectMenu-button ilex-button">')
                      .css('display', 'flex')
                      .width(width)
                      .append($selectedOption)
                      .append($caretButton)
                      .appendTo($parent);
  
  var setSelected = function () {
    let $selectedElement = ilex.popupMenu.createMenuElement(popupElements[selected]);
    $selectedElement.width(elementWidth);
    $selectedElement.off('click');
    $selectedElement.removeClass('ilex-popupMenuElement');
    $selectedOption.html($selectedElement);
  };
  
  var popupElements = [];
  for (let elm of elements) {
    let popupElm = [
      'standardButton', function(event, ind) {
        selected = ind;
        setSelected(selected);
        callback(selected);
      }
    ];
    popupElm = popupElm.concat(elm);
    popupElements.push(popupElm);
  }
  ilex.popupMenu.buttonBind(that.button, popupElements);
  setSelected();
    
  return that;
}
