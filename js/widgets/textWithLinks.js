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
  
  that.getDocumentObject = function () {
    return documentObject;
  };
  
  //Użyte abstrakcje
  //halfLink
  //link halflink posiadający parametr halfLink.secondHalf
  //resolvedLink = {top: 'link do którego przejdziemy po kliknięciu', 'all': pozostałe linki na tym }
  
  that.documentLinks = function () {
    var lineages = {};
    var addToLineage = function(halfLink) {
      if (lineages[halfLink.lineage] === undefined) {
        lineages[halfLink.lineage] = [halfLink];
      } else {
        lineages[halfLink.lineage].push(halfLink);
      }
    };
    
    var documentLinksReturn = {
      //@return resolvedLink
      'resolveLinage': function(lineage) {
        var curVerLineage = $.grep(lineages[lineage], function (v) {
          return v.versionNo === that.getVersion();
        });
        
        if (curVerLineage.length === 0) {
          return undefined;
        } else if (curVerLineage.length === 1) {
          return {'top': curVerLineage[0], 'all': curVerLineage};
        } else {
          let maxSecondHalf = curVerLineage[0];
          for (let i = 1; i < curVerLineage.length; i++) {
            let hl = curVerLineage[i];
            if (hl.secondHalf.versionNo > maxSecondHalf.secondHalf.versionNo) {
              maxSecondHalf = hl;
            }
          }
          return {'top': maxSecondHalf, 'all': curVerLineage};
          //console.log(that.getFileInfo('name'), curVerLineage);
//          let secondsHalfs = {};
//          for (let h of curVerLineage) {
//            ilex.server.linkGetLR(h, function(msg) {
//              var info = ilex.documents.get(msg.documentId);
//              console.log(h, that.getFileInfo('name'), msg, info['name']);
//            });
//          }
          
        }
      },
      'isTop': function (link) {
        if (this.resolveLinage(link.lineage).top.linkId === 
            link.linkId) {
          return true;
        }
        return false;
      },
      'create': function (halfLink, secondHalf, callback) {
        if (callback === undefined) {
          callback = function () {};
        }
        var addToDocument = function (link) {
          addToLineage(link);
          if (documentLinksReturn.isTop(link)) {
            that.setLink({'top': link, 'all': [link]});
            $(document).trigger('canvasRedraw');
          }
          callback(halfLink);
        };
        if (secondHalf !== undefined) {
          var link = halfLink;
          link.secondHalf = secondHalf;
          addToDocument(link);
        } else {
          ilex.server.linkGetLR(halfLink, function(msg) {
            var link = halfLink;
            link.secondHalf = msg;
            addToDocument(halfLink)
          });
        } 

      },
      'load': function(halfLinks, callback) {
        if (halfLinks === null) {
          return;
        }
        if (callback === undefined) {
          callback = function () {};
        }
        var secondLinksToLoad = halfLinks.length;
        for (let halfLink of halfLinks) {
          ilex.server.linkGetLR(halfLink, function(msg) {
            var link = halfLink;
            link.secondHalf = msg;
            
            addToLineage(link);
            secondLinksToLoad -= 1;
            if (secondLinksToLoad === 0) {
              callback();
            }
          });
        }
      },
      'getResolved': function () {
        var resolved = [];
        for (let lineage in lineages) {
          if (lineages.hasOwnProperty(lineage)) {
            let resolvedLink = this.resolveLinage(lineage);
            if (resolvedLink !== undefined) {
              resolved.push(resolvedLink);
            }
          }
        }
        return resolved;
      }
    };
    return documentLinksReturn;
  }();
  
  
  that.getVersion = function () {
    return version.get();
  };
  
  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf016;</span>', //<span class="ilex-awesome">&#xf00d;</span>
    function(event) {
      windowObject.closeDocument();
      ilex.tools.mime.createDocument(windowObject, 'plain text');
  });
  
  that.dock.toolbarTop.addSeparator();
  
  that.documentNameInput =
    ilex.widgetsCollection.blockInput(that.dock.toolbarTop.container, 'Untitled document');
  that.documentNameInput.element
    .width('200px')
    .css('display', 'inline-block')
    .css('line-height', '26px')
    .css('vertical-align', 'middle');
  
  //set name
  that.documentNameInput.val(that.getFileInfo('name'));
  
  that.documentNameInput.element.on('blur', function () {
    var val = that.documentNameInput.val();
    if (val !==  that.getFileInfo('name')) {
      documentObject.changeName(val, function () {
        $(document).trigger('ilex-documentNameChanged', [windowObject]);
      });
    }
  });
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
        that.documentLinks.load(resp.links, function() {
          //load text
          version.set(v);
          that.textEditor.setContent(resp.text);
          
          //load links
          let resolved = that.documentLinks.getResolved();
          for (let resolvedLink of resolved) {
            that.setLink(resolvedLink);
          }
          $(document).trigger('canvasRedraw');

          if (typeof callback === 'function') {
            callback();
          }
        });
      },
      function (resp) {
//        ilex.error.raise(resp.error);
      }
    );
  };
  
    
//  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf032;</span>', //bold
//    function(event) {
//      
//  });
//  
//  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf033;</span>', //italic
//    function(event) {
//      
//  });
//  
//  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf0cd;</span>', //underline
//    function(event) {
//      
//  });
  
//  that.dock.toolbarTop.addSeparator('15px');
//  
//  
//  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf127;</span>', function () {
//    let $spans = that.textEditor.getSelectionSpans();
//    $spans.css('text-decoration', 'underline').css('color', 'blue');
//  });
//  
  that.dock.toolbarTop.addSeparator('15px');
  
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
      'getIdsFromClassNames': function (classNames) {
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
  
  var appendResolvedLinkToSpans = function($spans, resolvedLink) {
    $spans.each(function () {
      var resolvedLinks = $(this).data('ilex-links');
      if (resolvedLinks === undefined) {
        resolvedLinks = [resolvedLink];
      } else {
        resolvedLinks.push(resolvedLink);
      }
      $(this).data('ilex-links', resolvedLinks);
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

  
  that.setLink = function (resolved) {
    var top = resolved.top,
        all = resolved.all,
      halfLinkRange = document.createRange(),
      start = that.textEditor.textDocument.relPosition(top.range.position),
      end = that.textEditor.textDocument.relPosition(top.range.position +
                                                          top.range.length);
    
    if (start === false || end === false) {
      return;
    }
    
    halfLinkRange.setStart(start.span.firstChild, start.position);
    halfLinkRange.setEnd(end.span.firstChild, end.position);
    
    let $spans = that.textEditor.getRangeSpans(halfLinkRange);
    
    for (let hl of all) {
      let halfLinkClass = halfLinkTools.getClassName(hl);
      $spans.addClass('ilex-textLink').addClass(halfLinkClass);
      appendResolvedLinkToSpans($spans, resolved);
    }

    
    if (ilex.conf.get('browsing mode') === 1) {
      $spans.addClass('ilex-textLinkNavigationMode');
    }
    
    $spans.off('click mouseover mouseleave');
    $spans.on('click', function () {
      if (ilex.conf.get('browsing mode') === 1) {
        $(document).trigger('ilex-linkClicked', [windowObject, resolved]);
      }
    });
    $spans.on('mouseover', function (event) {
      if (ilex.conf.get('browsing mode') === 1) {
        let file = ilex.documents.get(top.secondHalf.documentId),
                    $span = $('<span>').text(file.name);
        
        if (top.secondHalf.versionNo < file.totalVersions) {
          $span.css('font-family', 'IlexSansOblique');
        }
        
//        ilex.server.linkGetLR(halfLink, function (msg) {
//          var file = ilex.documents.get(msg.documentId),
//              $span = $('<span>').text(file.name);
//          if (msg.versionNo < file.totalVersions) {
//            $span.css('font-family', 'IlexSansOblique');
//          }
          ilex.view.popupNote.show(event.pageY, event.pageX, $span);
	  }
    });
    $spans.on('mouseleave', function (event) {
      ilex.view.popupNote.hide();
    });
  };
  
  var version = {};
  version.element = $('<span>0</span>').appendTo(that.dock.toolbarTop.container)
                                    .css('font', '12px IlexSans')
                                    .css('display', 'inline-block')
                                    .css('margin', '0 4px');
  version.set = function (v) {
    if (v === that.getFileInfo('totalVersions')) {
      version.element.html(v + ' (cur.)');
      that.textEditor.allowChanges = true;
    } else {
      version.element.text(v);
      that.textEditor.allowChanges = false;
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
  
  $(document).on('ilex-newLinkAdded', function (event, params) {
    if (params.tab === windowObject.tabId &&
        version.get() === that.getFileInfo('totalVersions')) {
      var halfLink = params;
      that.documentLinks.create(halfLink);
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
  
//  that.dock.toolbarTop.addSeparator('15px');
//  
//  that.dock.toolbarTop.addButton('<span class="ilex-awesome">&#xf070;</span>', //slash eye
//    function(event) {
//      $(this).find('span').html('&#xf06e;');//slash eye
//      $(this).addClass('ilex-active');
//    },
//    function (event) {
//      $(this).find('span').html('&#xf070;');//eye
//      $(this).removeClass('ilex-active');
//    });
  
  that.textEditor.content.on('documentAddText', function(event, data) {
    var links = halfLinkTools.getIdsFromClassNames(data.span.classList);
    documentObject.addText(data.absStart, data.value, links);
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
        alert('Cut');
      }, {
          'text': 'Cut',
          'icon': '<span class="ilex-awesome">&#xf0c4;</span>',
          'shortcutLabel': 'Ctrl+X'
      }],
    ['standardButton', function() {
        alert('Copy');
      }, {
          'text': 'Copy',
          'icon': '<span class="ilex-awesome">&#xf0c5;</span>',
          'shortcutLabel': 'Ctrl+C'
      }],
    ['standardButton', function() {
        alert('Paste');
      }, {
          'text': 'Paste',
          'icon': '<span class="ilex-awesome">&#xf0ea;</span>',
          'shortcutLabel': 'Ctrl+V'
      }],
    ['separator'],
    ['standardButton', function() {
        alert('Comment');
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
