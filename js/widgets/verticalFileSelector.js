'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.verticalFileSelector !== undefined)
  throw 'ilex.widgetsCollection.verticalFileSelector already defined';


ilex.widgetsCollection.verticalFileSelector = function ($parentWidget) {
  var that = {},
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height');

  that.container = $('<div class="ilex-resize ilex-fileSelector">')
                  .css('background-color', '#fff')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parentWidget.html(that.container);
  
  //marting to - fix strange chorme bug
  $('<div>').height('5px').html('&nbsp;').appendTo(that.container)
  

  that.filterInput = ilex.widgetsCollection.blockInput(that.container, 'Filter documents');
  
  that.filterInput.element.on('input', function(event) {
    var $this = $(this),
        query = $(this).text();
    
    that.fileContainer.find('.ilex-file').each(function () {
      var $div = $(this);
      if ($div.text().indexOf(query) !== -1) {
        $div.show();
      } else {
        $div.hide();
      }
    });
  });
  
  that.fileContainer = $('<div class="ilex-fileContainer">').appendTo(that.container);

  that.loadFilesList = function(filesList) {
    for (let file of filesList) {
      let $div = $('<div class="ilex-file">').appendTo(that.fileContainer)
                .text(file.name)
                .attr('draggable', 'true')
                .css('font-size', '10px')
                .css('padding', '2px')
                .css('border', '1px solid #000')
                .css('margin', '5px')
                .css('cursor', '-webkit-grab')
                .css('cursor', 'grab');
      
      $div.on('dragstart', function(event) {
        event.originalEvent.dataTransfer.setData('ilex/file', JSON.stringify(file));
        $('.ilex-dropableRegion').show();
      });
      $div.on('dragend', function(event) {
        $('.ilex-dropableRegion').css('background', 'transparent').hide();
      });
    };
  };
  
//  var $createNewDocumentLink = 
//      $('<a href="#">Create new document</a>').appendTo(that.container)
//                .css('display', 'block')
//                .css('font-size', '12px')
//                .css('text-decoration', 'underline')
//                .css('margin', '5px')
//                .css('margin-top', '20px');
  
  
  
  that.container.on('windowResize', function(event) {
    width = that.container.parent().data('ilex-width');
    height = that.container.parent().data('ilex-height');
    
    that.container.data('ilex-width', width).data('ilex-height', height);
  });


  return that;
}
