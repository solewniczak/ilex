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

ilex.widgetsCollection.textWithLinks = function(windowObject, documentObject, startVersion, firstLoadCallback) {
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
//  that.dock.toolbarSeparator = $('<div>').appendTo(that.dock.container)
//                                  .height('5px');
//  that.dock.toolbarBottom = ilex.widgetsCollection.toolbar(that.dock);
//  
//  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf00d;</span>', //<span class="ilex-awesome">&#xf00d;</span>
//    function(event) {
//      windowObject.closeTab();
//  });
//
//  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf016;</span>', //<span class="ilex-awesome">&#xf00d;</span>
//    function(event) {
//      windowObject.closeDocument();
//      ilex.tools.mime.createDocument(windowObject, 'plain text');
//  });
  
  that.getFileInfo = function (attr) {
    return ilex.documents.get(documentObject.getId())[attr];
  };
  
  var documentLinks = [];
  that.getLinks = function () {
    return documentLinks;
  };
  
  that.getVersion = function () {
    return version.get();
  };
  
//  that.documentNameInput =
//    ilex.widgetsCollection.blockInput(that.dock.toolbarTop.container, 'Untitled document');
//  that.documentNameInput.element
//    .width('200px')
//    .css('display', 'inline-block')
//    .css('vertical-align', 'middle');
//  
//  //set name
//  that.documentNameInput.val(that.getFileInfo('name'));
//  
//  that.documentNameInput.element.on('blur', function () {
//    var val = that.documentNameInput.val();
//    if (val !==  that.getFileInfo('name')) {
//      documentObject.changeName(val);
//    }
//  });
//  
//  
//  that.dock.toolbarTop.addSeparator();
  
  that.loadVersion = function(v, callback) {
    if (v === version.get()) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }
    ilex.server.documentGetDump(windowObject.tabId, documentObject.getId(), v,
      function (resp) {
        version.set(v);
        that.textEditor.setContent(resp.text);
        documentLinks = resp.links;
        if (resp.links !== null) {
          for (let link of resp.links) {
            that.setLink(link);
          }
        }
        if (typeof callback === 'function') {
          callback();
        }
        $(document).trigger('canvasRedraw');
      }
    );
  };
  
    
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf032;</span>', //bold
    function(event) {
      
  });
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf033;</span>', //italic
    function(event) {
      
  });
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf0cd;</span>', //underline
    function(event) {
      
  });
  
  that.dock.toolbarTop.addSeparator('15px');
  
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf127;</span>', function () {
    let $spans = that.textEditor.getSelectionSpans();
    $spans.css('text-decoration', 'underline').css('color', 'blue');
  });
  
  that.dock.toolbarTop.addSeparator('30px');
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf104;</span>', //<
    function(event) {
      var v = version.get();
      if (v > 1) {
        v -= 1;
        //load new version
        that.loadVersion(v);  
      }
  });

  $(document).on('ilex-navigationModeOn', function () {
    that.container.find('.ilex-textLink').addClass('ilex-textLinkNavigationMode');
  });
  
  $(document).on('ilex-navigationModeOff', function () {
    that.container.find('.ilex-textLink').removeClass('ilex-textLinkNavigationMode');
  });
  
  var linkTools = function() {
    var prefix = 'ilex-linkId-';
    return {
      'createLinkClassName': function(link) {
        return prefix + link.linkId;
      },
      'getLinkIdsFromClassNames': function (classNames) {
        if (classNames === undefined) {
          return [];
        }
        if (typeof classNames === 'string' || classNames instanceof String) {
          var classList = classNames.split(' ');
        } else {
          var classList = classNames;
        }
        var linksList = [];
        for (let class_name of classList) {
          if (class_name.indexOf(prefix) !== -1) {
            linksList.push(class_name.slice(prefix.length));
          }
        }
        return linksList;
      }
    };
  }();
  
  var appendLinkToSpans = function($spans, link) {
    $spans.each(function () {
      var links = $(this).data('ilex-links');
      if (links === undefined) {
        links = [link];
      } else {
        links.push(link);
      }
      $(this).data('ilex-links', links);
    });
  };
  
  that.textEditor = ilex.widgetsCollection.textEdiotr(that.container);
    
  that.setLink = function (link) {
    var linkRange = document.createRange(),
        start = that.textEditor.textDocument.relPosition(link.from.range.position),
        end = that.textEditor.textDocument.relPosition(link.from.range.position +
                                                          link.from.range.length);
    
    if (start === false || end === false) {
      return;
    }
    
    linkRange.setStart(start.span.firstChild, start.position);
    linkRange.setEnd(end.span.firstChild, end.position);
    
    let $spans = that.textEditor.getRangeSpans(linkRange);
    
    let linkClass = linkTools.createLinkClassName(link);
    $spans.addClass('ilex-textLink').addClass(linkClass);
    appendLinkToSpans($spans, link);
    
    if (ilex.conf.get('browsing mode') === 1) {
      $spans.addClass('ilex-textLinkNavigationMode');
    }
    
    that.textEditor.content.on('click', '.'+linkClass, function () {
      if (ilex.conf.get('browsing mode') === 1) {
        $(document).trigger('ilex-linkClicked', [windowObject, link]);
      }
    });
    that.textEditor.content.on('mouseover', '.'+linkClass, function (event) {
      if (ilex.conf.get('browsing mode') === 1) {
        var file = ilex.documents.get(link.to.documentId);
        ilex.view.popupNote.show(file.name + ' | <strong>'+link.to.versionNo+'</strong>');
      }
    });
    that.textEditor.content.on('mouseleave', '.'+linkClass, function (event) {
      ilex.view.popupNote.hide();
    });
  };
  
  var version = {};
  version.element = $('<span>0</span>').appendTo(that.dock.toolbarTop.container)
                                    .css('font-size', '14px')
                                    .css('display', 'inline-block')
                                    .css('margin', '0 4px');
  version.set = function (v) {
    if (v === that.getFileInfo('totalVersions')) {
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
  
  //wait for version and names changes
  $(document).on('ilex-fileInfoUpdated', function (event, fileId) {
    if (documentObject.getId() === fileId) {
      version.set(that.getFileInfo('totalVersions'));
    }
  });
  
  $(document).on('ilex-documentChangeName', function (event, params) {
    if (params.tab === windowObject.tabId) {
      that.documentNameInput.val(params.name);
    }
  });
  
  //wait for changes
  $(document).on('ilex-documentAddText', function (event, params) {
    if (params.tab === windowObject.tabId &&
        version.get() === that.getFileInfo('totalVersions')) {
      that.textEditor.insertText(params.position, params.string);
    }
  });
  
  $(document).on('ilex-documentRemoveText', function (event, params) {
    if (params.tab === windowObject.tabId &&
        version.get() === that.getFileInfo('totalVersions')) {
      that.textEditor.removeText(params.position, params.length);
    }
  });
  
  
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf105;</span>', //>
    function(event) {
      var v = version.get();
      if (v < that.getFileInfo('totalVersions')) {
        v += 1;
        //load new version
        that.loadVersion(v);  
      }
  });
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf101;</span>', //>>
    function(event) {
      var v = that.getFileInfo('totalVersions');
      if (v !== version.get()) {
        //load new version
        that.loadVersion(v);  
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
  
  that.textEditor.content.on('documentAddText', function(event, data) {
    var links = linkTools.getLinkIdsFromClassNames(data.span.classList);
    documentObject.addText(data.absStart - 1, data.value, links);
  });
  
  that.textEditor.content.on('documentRemoveText', function(event, data) {  
    documentObject.removeText(data.absStart, data.length);
  });
  
  //load text
  if (startVersion === undefined) {
    startVersion = that.getFileInfo('totalVersions');
  }
  that.loadVersion(startVersion, firstLoadCallback);  
  
  var textTools = [
    ['standardButton', function() {
        alert('cut');
      }, {
          'text': 'Cut',
          'icon': '<span class="ilex-awesome">&#xf0c4;</span>',
          'shortcutLabel': 'Ctrl+X'
      }],
    ['standardButton', function() {
        alert('jump2');
      }, {
          'text': 'Copy',
          'icon': '<span class="ilex-awesome">&#xf0c5;</span>',
          'shortcutLabel': 'Ctrl+C'
      }],
    ['standardButton', function() {
        alert('jump2');
      }, {
          'text': 'Paste',
          'icon': '<span class="ilex-awesome">&#xf0ea;</span>',
          'shortcutLabel': 'Ctrl+V'
      }],
    ['separator'],
    ['standardButton', function() {
        alert('jump2');
      }, {
          'text': 'Comment',
          'icon': '<span class="ilex-awesome">&#xf27b;</span>',
          'shortcutLabel': 'Ctrl+Alt+M'
      }],
  ];
  
  that.textEditor.content.on('contextmenu', '.ilex-textLink', function (event) {
    event.preventDefault();
    var links = $(this).data('ilex-links'),
        linkJumps = [];
    if (links !== undefined) {
      for (let link of links) {
        var file = ilex.documents.get(link.to.documentId);
//        ilex.view.popupNote.show(file.name + ' | <strong>'+link.to.versionNo+'</strong>');
        
        linkJumps.push([
          'standardButton', function() {
            alert('jump2');
          }, {
            'text': file.name,
            'icon': '<span class="ilex-awesome">&#xf0c1;</span>'
          }
        ]);
      }
    }
    
    let menu = linkJumps.concat([['separator']], textTools);
    ilex.popupMenu.show(event.pageY, event.pageX, menu, 220);
  });

  that.textEditor.content.on('contextmenu', 'span:not(.ilex-textLink)',
                             function (event) {
    event.preventDefault();

    let menu = textTools;
    ilex.popupMenu.show(event.pageY, event.pageX, menu);
    
    return false;
  });

  
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