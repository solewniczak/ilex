'use strict';

//requires: ilex.canvas
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.text !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

//file is allTextsInfoResponse object
//document is ilex.tools.server.document object

ilex.widgetsCollection.textWithLinks = function(windowObject, documentObject) {
  var that = {},
    width = windowObject.element.data('ilex-width'),
    height = windowObject.element.data('ilex-height');
  
  that.container = $('<div class="ilex-resize ilex-textWithLinks">')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  windowObject.widget.html(that.container);

  that.dock = {};
  that.dock.container = $('<div class="ilex-dock">').appendTo(that.container);
                          //.data('ilex-width', width);
                          //height depends on button's sizes
  
  //add toolbar at the end to give it access to entre text object
  //that.dock.toolbar = ilex.widgetsCollection.textToolbar(that.dock.container, that, canvas);
  
  that.dock.toolbarTop = ilex.widgetsCollection.toolbar(that.dock);
  that.dock.toolbarSeparator = $('<div>').appendTo(that.dock.container)
                                  .height('5px');
  that.dock.toolbarBottom = ilex.widgetsCollection.toolbar(that.dock);
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf00d;</span>', //<span class="ilex-awesome">&#xf00d;</span>
    function(event) {
      windowObject.closeTab();
  });

  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf016;</span>', //<span class="ilex-awesome">&#xf00d;</span>
    function(event) {
      windowObject.closeDocument();
  });
  
  var getFileInfo = function (attr) {
    return ilex.documents.get(documentObject.getId())[attr];
  }
  
  that.documentNameInput =
    ilex.widgetsCollection.blockInput(that.dock.toolbarTop.container, 'Untitled document');
  that.documentNameInput.element
    .width('200px')
    .css('display', 'inline-block')
    .css('vertical-align', 'middle');
  
  //set name
  that.documentNameInput.val(getFileInfo('name'));
  
  that.documentNameInput.element.on('blur', function () {
    var val = that.documentNameInput.val();
    if (val !==  getFileInfo('name')) {
      documentObject.changeName(val);
    }
  });
  
  
  that.dock.toolbarTop.addSeparator();
  
  var loadVersion = function(v) {
    ilex.server.documentGetDump(windowObject.tabId, documentObject.getId(), v,
      function (resp) {
        that.textEditor.setContent(resp.text);
      }
    );
  };
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf104;</span>', //<
    function(event) {
      var v = version.get();
      if (v > 1) {
        v -= 1;
        version.set(v);
        //load new version
        loadVersion(v);  
      }
  });
  
  that.textEditor = ilex.widgetsCollection.textEdiotr(that.container);
  
  var version = {};
  version.element = $('<span>0</span>').appendTo(that.dock.toolbarTop.container)
                                    .css('font-size', '14px')
                                    .css('display', 'inline-block')
                                    .css('margin', '0 4px');
  version.set = function (v) {
    if (v === getFileInfo('totalVersions')) {
      version.element.html(v + ' (cur.)');
      that.textEditor.content.attr('contenteditable', 'true');
    } else {
      version.element.text(v);
      that.textEditor.content.attr('contenteditable', 'false');
    }
  };
  
  version.get = function () {
    return parseInt(version.element.text());
  };
  
  //set current version
  version.set(getFileInfo('totalVersions'));
  
  //wait for version and names changes
  $(document).on('ilex-fileInfoUpdated', function (event, fileId) {
    if (documentObject.getId() === fileId) {
      version.set(getFileInfo('totalVersions'));
    }
  });
  
  $(document).on('ilex-documentChangeName', function (event, params, tabId) {
    if (tabId === windowObject.tabId) {
      that.documentNameInput.val(params.name);
    }
  });
  
  //wait for changes
  $(document).on('ilex-documentAddText', function (event, params, tabId) {
    if (tabId === windowObject.tabId &&
        version.get() === getFileInfo('totalVersions')) {
      that.textEditor.insertText(params.string, params.position);
    }
  });
  
  
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf105;</span>', //>
    function(event) {
      var v = version.get();
      if (v < getFileInfo('totalVersions')) {
        v += 1;
        version.set(v);
        //load new version
        loadVersion(v);  
      }
  });
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf101;</span>', //>>
    function(event) {
      var v = getFileInfo('totalVersions');
      if (v !== version.get()) {
        version.set(v);
        //load new version
        loadVersion(v);  
      }
  });
  
  that.dock.toolbarTop.addSeparator('15px');
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf070;</span>', //slash eye
    function(event) {
      $(this).find('span').html('&#xf06e;');//slash eye
      $(this).addClass('ilex-active');
    },
    function (event) {
      $(this).find('span').html('&#xf070;');//eye
      $(this).removeClass('ilex-active');
    });
  
  
  that.dock.toolbarBottom.addButton('<span class="ilex-awesome">&#xf032;</span>', //bold
    function(event) {
      
  });
  
  that.dock.toolbarBottom.addButton('<span class="ilex-awesome">&#xf033;</span>', //italic
    function(event) {
      
  });
  
  that.dock.toolbarBottom.addButton('<span class="ilex-awesome">&#xf0cd;</span>', //underline
    function(event) {
      
  });
  
  that.dock.toolbarBottom.addSeparator('15px');
  
  that.dock.toolbarBottom.addButton('<span class="ilex-awesome">&#xf127;</span>', function () {
    let $spans = that.textEditor.getSelectionSpans();
    $spans.css('text-decoration', 'underline').css('color', 'blue');
  });


  
  that.textEditor.content.on('documentAddText', function(event, data) {
    documentObject.addText(data.absStart - 1, data.value);
  });
  
  that.textEditor.content.on('documentRemoveText', function(event, data) {  
    documentObject.removeText(data.absStart, data.length);
  });
  
  //load text
  loadVersion(getFileInfo('totalVersions'));  

  
//  that.loadText = function (params) {
//    that.document = ilex.server.document(windowObject.tabId, params.name, params.id);
//    for (let line of params.text.split('\n')) {
//      let $line = that.textEditor.textDocument.insertLineAfter();
//      //that.textEditor.textDocument.insertText($line.find("span"), 0, line + "\n");
//      $line.find("span").text(line + '\n');
//    }
//  };
  
  that.container.on('windowResize', function(event) {
    var width = windowObject.element.data('ilex-width'),
      height = windowObject.element.data('ilex-height');

      that.container.data('ilex-width', width);
      //that.dock.container.data('ilex-width', width);
    
      //remember about dock!
      that.container.data('ilex-height', height - that.dock.container.height());
    
      //dock conatiner height does not choange
      //content height shrinks
      //that.content.data('ilex-height', height - that.dock.container.height());
  });
  return that;
};