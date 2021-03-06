'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.verticalFileHierarchy !== undefined)
  throw 'ilex.widgetsCollection.verticalFileHierarchy already defined';


ilex.widgetsCollection.verticalFileHierarchy = function ($parentWidget) {
  var that = {},
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    filterMargin = 7;
  
  that.container = $('<div class="ilex-resize ilex-fileSelector">')
                  .css('background-color', '#fff')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parentWidget.html(that.container);
  
  //file upload
  var $fileSelector = $('<input type="file" multiple>')
                                            .appendTo($parentWidget).show();
  //http://stackoverflow.com/questions/14155310/upload-file-as-string-to-javascript-variable
  $fileSelector.on('change', function (changeEvent) {
    for (var i = 0; i < changeEvent.target.files.length; ++i) {
      (function (file) {               // Wrap current file in a closure.
        var loader = new FileReader();
        loader.onload = function (loadEvent) {
          if (loadEvent.target.readyState != 2)
            return;
          if (loadEvent.target.error) {
            console.log("Error while reading file " + file.name + ": " + loadEvent.target.error);
            return;
          }
          var name = file.name.replace(/\.\w*$/, '');
          $(document).trigger('ilex-createAndOpenDocument', ['plain text', name, loadEvent.target.result]);
        };
        loader.readAsText(file);
      })(changeEvent.target.files[i]);
    }
  });
  
  that.container.on('contextmenu', function (event) {
    event.preventDefault();
      var menu = [
          ['standardButton', function() {
             $fileSelector.trigger('click');
            }, {
              'text': 'Import',
              'shortcutLabel': 'Ctrl+O'
          }]
      ];
    ilex.popupMenu.show(event.pageY, event.pageX, menu, 180);
  });
    
  var globalTools = ilex.widgetsCollection.globalTools(that.container);
  
  //marting to - fix strange chorme bug
  $('<div>').height('5px').html('&nbsp;').appendTo(that.container)
  

  that.filterInput = ilex.widgetsCollection.blockInput(that.container, 'Filter documents');
  that.filterInput.element.css('margin-left', filterMargin+'px');
  
  var filterFiles = function (query) {
    var query = that.filterInput.val();
    
    that.fileContainer.find('.ilex-fileListElement').each(function () {
      var $div = $(this);
      if ($div.find('.ilex-file').text().indexOf(query) !== -1) {
        $div.show();
      } else {
        $div.hide();
      }
    });
  }
  
  that.filterInput.element.on('input', filterFiles);
  
  
  that.fileContainer = $('<div class="ilex-fileContainer">').appendTo(that.container);

  $(document).on('ilex-documentsChanged', function() {
    that.fileContainer.html('');
    for (let [id, file] of ilex.documents.map) {
      let $superDiv = $('<div class="ilex-fileListElement">').appendTo(that.fileContainer)
                .css('padding', '5px 0')
                .css('padding-left', '10px')
                .css('font', '12px IlexSans')
                .css('white-space', 'nowrap')
                .css('overflow', 'hidden')
                .css('text-overflow', 'ellipsis')
                .attr('draggable', 'true')
                .css('cursor', 'default');
      
      let $icon = $('<span>').html(ilex.tools.mime.formats['plain text'].icon).appendTo($superDiv)
          .css('padding-right', '10px');
      let $div = $('<span class="ilex-file">').appendTo($superDiv)
          .text(file.name);
      
      $superDiv.on('mousedown', function () {
        that.fileContainer.find('.ilex-fileListElement').css('background', 'transparent');
        $(this).css('background', '#C5DCB1');
      });
      
      $superDiv.on('dblclick', function () {
       $(document).trigger('ilex-openDocument', [file]);
      });
      
      $superDiv.on('dragstart', function(event) {
        var dataTransfer = event.originalEvent.dataTransfer,
            $dragElement = $('<div class="ilex-dragImage">').appendTo("body")
              .width(180)
              .css('text-align', 'center')
              .css('padding-top', '5px')
              .html(ilex.tools.mime.formats['plain text'].icon);
        $dragElement.find("span")
          .css('font-size', '30px');
        var $title = $('<div>').appendTo($dragElement)
                        .css('padding-top', '5px');
        var $titleText = $('<span>').appendTo($title)
                .text(file.name)
                .css('font', '12px IlexSans')
                .css('color', '#fff')
                .css('background-color', '#000');

        
        dataTransfer.setDragImage($dragElement[0], 85, 20);
        dataTransfer.setData('ilex/file', JSON.stringify(file));
        $('.ilex-dropableRegion').show();
      });
      $superDiv.on('dragend', function(event) {
        $('.ilex-dropableRegion').css('background', 'transparent').hide();
        $(".ilex-dragImage").remove();
      });
    };
    //filter files after adding them
    filterFiles();
  });
  
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
    that.filterInput.element.data('ilex-width', width - 3*filterMargin);
  });


  return that;
}
