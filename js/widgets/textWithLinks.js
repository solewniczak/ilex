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
  
  var documentHalfLinks = [];
  that.getHalfLinks = function () {
    return documentHalfLinks;
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
        documentHalfLinks = resp.links;
        if (documentHalfLinks !== null) {
          for (let halfLink of documentHalfLinks) {
            that.setHalfLink(halfLink);
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
  
  var halfLinkTools = function() {
    var prefix = 'ilex-linkId-';
    return {
      'getClassName': function(link) {
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
  
  var appendHalfLinkToSpans = function($spans, halfLink) {
    $spans.each(function () {
      var halfLinks = $(this).data('ilex-links');
      if (halfLinks === undefined) {
        halfLinks = [halfLink];
      } else {
        halfLinks.push(halfLink);
      }
      $(this).data('ilex-links', halfLinks);
    });
  };
  
  that.textEditor = ilex.widgetsCollection.textEdiotr(that.container);
  
  that.canLink = function() {
    var $selectedSpans = that.textEditor.getSelectedSpans();
    if ($selectedSpans.length === 0 ||
        $selectedSpans.hasClass('ilex-textLink')) {
      return false;
    }
    return true;
  }
    
  that.setHalfLink = function (halfLink) {
    var halfLinkRange = document.createRange(),
      start = that.textEditor.textDocument.relPosition(halfLink.range.position),
      end = that.textEditor.textDocument.relPosition(halfLink.range.position +
                                                          halfLink.range.length);
    
    if (start === false || end === false) {
      return;
    }
    
    halfLinkRange.setStart(start.span.firstChild, start.position);
    halfLinkRange.setEnd(end.span.firstChild, end.position);
    
    let $spans = that.textEditor.getRangeSpans(halfLinkRange);
    
    let halfLinkClass = halfLinkTools.getClassName(halfLink);
    $spans.addClass('ilex-textLink').addClass(halfLinkClass);
    appendHalfLinkToSpans($spans, halfLink);
    
    if (ilex.conf.get('browsing mode') === 1) {
      $spans.addClass('ilex-textLinkNavigationMode');
    }
    
    that.textEditor.content.on('click', '.'+halfLinkClass, function () {
      if (ilex.conf.get('browsing mode') === 1) {
        $(document).trigger('ilex-linkClicked', [windowObject, halfLink]);
      }
    });
    that.textEditor.content.on('mouseover', '.'+halfLinkClass, function (event) {
      if (ilex.conf.get('browsing mode') === 1) {
        ilex.server.linkGetLR(halfLink, function (msg) {
          var file = ilex.documents.get(msg.documentId),
              $span = $('<span>').text(file.name);
          if (msg.versionNo < file.totalVersions) {
            $span.css('font-family', 'IlexSansOblique');
          }
          ilex.view.popupNote.show(event.pageY, event.pageX, $span);
	  });
//        var file = ilex.documents.get(link.documentId);
//        ilex.view.popupNote.show(file.name + ' | <strong>'+link.versionNo+'</strong>');
      }
    });
    that.textEditor.content.on('mouseleave', '.'+halfLinkClass, function (event) {
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
    var haflLinks = $(this).data('ilex-links');
    if (haflLinks !== undefined && haflLinks.length === 1) {
        //
      var halfLink = haflLinks[0];
	  ilex.server.linkGetLR(halfLink, function (msg) {
        var file = ilex.documents.get(msg.documentId),
          linkJumps = [
            ['standardButton', function() {
               $(document).trigger('ilex-linkClicked', [windowObject, halfLink]);
              }, {
                'text': file.name,
                'icon': '<span class="ilex-awesome">&#xf0c1;</span>'
            }],
		  ['separator']
        ];
		let menu = linkJumps.concat(textTools);
    	ilex.popupMenu.show(event.pageY, event.pageX, menu, 220);
	  });
    } else {
      let menu = textTools;
      ilex.popupMenu.show(event.pageY, event.pageX, menu, 220);
	}
	  //        ilex.view.popupNote.show(file.name + ' | <strong>'+link.to.versionNo+'</strong>');
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