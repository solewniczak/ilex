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
  
  that.isLinkable = function () {
    return true;
  };
  
  //Użyte abstrakcje
  //halfLink
  //link halflink posiadający parametr halfLink.secondHalf
  //resolvedLink = {top: 'link do którego przejdziemy po kliknięciu', 'all': pozostałe linki na tym }
  
  that.documentLinks = function () {
    var lineages = {};

    var documentLinksReturn = {
      'addToLineage': function(link) {
        if (lineages[link.lineage] === undefined) {
          lineages[link.lineage] = [link];
        } else {
          lineages[link.lineage].push(link);
        }
      },
      'clear': function () {
        lineages = {};
      },
      'hasLineage': function(lineage) {
        if (lineages[lineage] !== undefined) {
          return true;
        } else {
          return false;
        }
      },
      //@return resolvedLink
      'resolveLinage': function(lineage) {
        var resolveFollowing = function(curVerLineage) {
          let maxSecondHalf = curVerLineage[0];
          for (let i = 1; i < curVerLineage.length; i++) {
            let hl = curVerLineage[i];
            if (hl.secondHalf.versionNo > maxSecondHalf.secondHalf.versionNo) {
              maxSecondHalf = hl;
            }
          }
          return maxSecondHalf;
        };
        
        var resolveHistoric = function (curVerLineage) {
          let minSecondHalf = curVerLineage[0];
          for (let i = 1; i < curVerLineage.length; i++) {
            let hl = curVerLineage[i];
            if (hl.secondHalf.versionNo < minSecondHalf.secondHalf.versionNo) {
              minSecondHalf = hl;
            }
          }
          return minSecondHalf;
        };
        
        var curVerLineage = $.grep(lineages[lineage], function (v) {
          return v.versionNo === that.getVersion();
        });
        
        if (curVerLineage.length === 0) {
          return undefined;
        } else if (curVerLineage.length === 1) {
          return curVerLineage[0];
        } else {
          var type = curVerLineage[0].type;
          if (type === 'F') {
            return resolveFollowing(curVerLineage);
          } else if (type === 'H') {
            return resolveHistoric(curVerLineage);
          } else {
            console.log('documentLinks: unknown link type: '+type);
          }
          
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
//      'isTop': function (link) {
//        var resolvedLink = this.resolveLinage(link.lineage);
//        if (resolvedLink !== undefined && resolvedLink.linkId === 
//            link.linkId) {
//          return true;
//        }
//        return false;
//      },
//      'create': function (halfLink, secondHalf, callback) {
//        if (callback === undefined) {
//          callback = function () {};
//        }
//        var addToDocument = function (link) {
//          documentLinksReturn.addToLineage(link);
//          if (documentLinksReturn.isTop(link)) {
//            that.setLink(link);
//            $(document).trigger('canvasRedraw');
//          }
//          callback(halfLink);
//        };
//        if (secondHalf !== undefined) {
//          var link = halfLink;
//          link.secondHalf = secondHalf;
//          addToDocument(link);
//        } else {
//          ilex.server.linkGetLR(halfLink, function(msg) {
//            var link = halfLink;
//            link.secondHalf = msg;
//            addToDocument(halfLink)
//          });
//        } 
//
//      },
      'load': function(halfLinks, callback) {
        if (callback === undefined) {
          callback = function () {};
        }
        
        if (halfLinks === null) {
          callback();
          return;
        }
        
        var secondLinksToLoad = halfLinks.length;
        for (let halfLink of halfLinks) {
          ilex.server.linkGetLR(halfLink, function(msg) {
            var link = halfLink;
            link.secondHalf = msg;
            
//            documentLinksReturn.addToLineage(link);

            if (lineages[link.lineage] === undefined) {
              lineages[link.lineage] = [link];
              that.setLink(link);
            } else {
              lineages[link.lineage].push(link);
            }
            
            secondLinksToLoad -= 1;
            if (secondLinksToLoad === 0) {
              $(document).trigger('canvasRedraw');
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
    var docId = documentObject.getId();
    ilex.server.documentGetDump(windowObject.tabId, docId, v,
      function (resp) {
        //load text
        version.updateLastest(ilex.documents.get(docId).totalVersions);
        version.set(v);
        that.textEditor.setContent(resp.text);
      
        that.documentLinks.clear();
      
      that.documentLinks.load(resp.links, function () {
        //count correct lines widths in textEditor
        ilex.applySize();
        callback();
      });

//        that.documentLinks.load(resp.links, function() {
//          //load links
////          let resolved = that.documentLinks.getResolved();
////          for (let resolvedLink of resolved) {
////            that.setLink(resolvedLink);
////          }
//          $(document).trigger('canvasRedraw');
//
//          if (typeof callback === 'function') {
//            callback();
//          }
//        });
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
  
//  var halfLinkTools = function() {
//    var prefix = 'ilex-linkId-';
//    return {
//      'getClassName': function(link) {
//        return prefix + link.linkId;
//      },
//      'getIdsFromClassNames': function (classNames) {
//        if (classNames === undefined) {
//          return [];
//        }
//        if (typeof classNames === 'string' || classNames instanceof String) {
//          var classList = classNames.split(' ');
//        } else {
//          var classList = classNames;
//        }
//        var linksList = [];
//        for (let class_name of classList) {
//          if (class_name.indexOf(prefix) !== -1) {
//            linksList.push(class_name.slice(prefix.length));
//          }
//        }
//        return linksList;
//      }
//    };
//  }();
  
//  var appendResolvedLinkToSpans = function($spans, resolvedLink) {
//    $spans.each(function () {
//      var resolvedLinks = $(this).data('ilex-resolvedLinks');
//      if (resolvedLinks === undefined) {
//        resolvedLinks = [resolvedLink];
//      } else {
//        resolvedLinks.push(resolvedLink);
//      }
//      $(this).data('ilex-resolvedLinks', resolvedLinks);
//    });
//  };
  
  that.textEditor = ilex.widgetsCollection.textEdiotr(that.container);
  
  that.canLink = function() {
    var $selectedSpans = that.textEditor.getSelectedSpans();
    if ($selectedSpans.length === 0 ||
        $selectedSpans.hasClass('ilex-textLink')) {
      return false;
    }
    return true;
  };
  
  that.scrollTo = function(halfLink, clickPos) {
    that.textEditor.scrollTo('ilex-lineage-'+halfLink.lineage, clickPos);
  };
  
//  that.updateLink = function (prevLinkId, newResolvedLink) {
//    let halfLinkClass = 'ilex-linkId-'+prevLinkId;
//      $spans = that.textEditor.content.find('span.'+halfLinkClass);
//    
//    //remove previous classes
//    for (let spanClass of $spans.get(0).classList) {
//      if (spanClass.indexOf('ilex-linkId-') === 0) {
//        $spans.removeClass(spanClass);
//      }
//    }
//    
//    $spans.data('ilex-resolvedLinks', [newResolvedLink]);
//    
//    for (let hl of newResolvedLink.all) {
//      let halfLinkClass = halfLinkTools.getClassName(hl);
//      $spans.addClass(halfLinkClass);
//    }
//  };
  
  var getLinageFromClassList = function(classList) {
    for (let class_name of classList) {
      if (class_name.indexOf('ilex-lineage-') !== -1) {
        return class_name.replace(/^ilex-lineage-/, '');
      }
    }
  }
  

  that.clearLinks = function() {  
    let $spans = that.textEditor.content.find('span');
    
    $spans.removeClass('ilex-textLink');
    $spans.removeClass(function (index, css) {
      return (css.match (/(^|\s)ilex-lineage-\S+/g) || []).join(' ');
    });
    
    $spans.removeClass('ilex-linkType-H');
    $spans.removeClass('ilex-linkType-F');

//    $spans.data('ilex-resolvedLinks', undefined);
    $spans.off('click mouseover mouseleave');
    
  };
  
  that.setLink = function (resolved) {
    var halfLinkRange = document.createRange(),
      start = that.textEditor.textDocument.relPosition(resolved.range.position),
      end = that.textEditor.textDocument.relPosition(resolved.range.position +
                                                          resolved.range.length);
    
    if (start === false || end === false) {
      return;
    }
    
    halfLinkRange.setStart(start.span.firstChild, start.position);
    halfLinkRange.setEnd(end.span.firstChild, end.position);
    
    let $spans = that.textEditor.getRangeSpans(halfLinkRange);
    
    $spans.addClass('ilex-lineage-'+resolved.lineage);
    
//    for (let hl of all) {
//      let halfLinkClass = halfLinkTools.getClassName(hl);
//      $spans.addClass(halfLinkClass);
//    }
    //      setResolvedLinkToSpans($spans, resolved);
//    $spans.data('ilex-resolvedLinks', [resolved]);
    
    $spans.addClass('ilex-textLink');
    if (resolved.type === 'H') {
      $spans.addClass('ilex-linkType-H');
    } else if (resolved.type === 'F') {
      $spans.addClass('ilex-linkType-F');
    }

    
    if (ilex.conf.get('browsing mode') === 1) {
      $spans.addClass('ilex-textLinkNavigationMode');
    }
    
    $spans.off('click mouseover mouseleave');
    $spans.on('click', function (event) {
      var clickPos = {'top': event.pageY, 'left': event.pageX};
      if (ilex.conf.get('browsing mode') === 1) {
        $(document).trigger('ilex-linkClicked', [clickPos, windowObject, resolved.lineage]);
      }
    });
    $spans.on('mouseover', function (event) {
      if (ilex.conf.get('browsing mode') === 1) {
        let file = ilex.documents.get(resolved.secondHalf.documentId),
                    $span = $('<span>').text('"'+file.name+'"');
        
        
        if (resolved.secondHalf.type === 'H') {
          $span.css('font-family', 'IlexSansOblique');
          $span.append(' v. '+resolved.secondHalf.versionNo);
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
  version.lastest = 0;
  version.updateLastest = function (v) {
    if (v >= version.lastest) {
      version.lastest = v;
    } else {
      console.log('version.setLast: version: '+v+' is lower than lastest: '+version.lastest);
    }
  };
  
  version.set = function (v) {
    if (v === version.lastest) {
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
//  $(document).on('ilex-fileInfoUpdated', function (event, fileId) {
//    if (documentObject.getId() === fileId) {
//      version.set(that.getFileInfo('totalVersions'));
//    }
//  });

//  $(document).on('ilex-updateLineage', function (e, lineage) {
//    if (that.documentLinks.hasLineage(lineage)) {
//      that.textEditor.allowChanges = false;
//    
//      //remove documents links from array
//      that.documentLinks.clear();
//      
//      //get new links
//      ilex.server.documentGetDump(windowObject.tabId,
//                                  documentObject.getId(),
//                                  that.getVersion(),
//        function (resp) {
//          that.documentLinks.load(resp.links, function() {
//            //remove links spans
//            that.clearLinks();
//
//            //load links
//            let resolved = that.documentLinks.getResolved();
//            for (let resolvedLink of resolved) {
//              that.setLink(resolvedLink);
//            }
//            $.when($(document).trigger('canvasRedraw')).done(function () {
//              that.textEditor.allowChanges = true;
//            });
//          });
//      });
//    } 
//  });
  
  $(document).on('ilex-versionNumberIncremented', function (event, params) {
    if (params.tab === windowObject.tabId) {
      version.updateLastest(params.version);
      //we are viewing previous version
      if (that.getVersion() === params.version - 1) {
        version.set(params.version);
      }
      that.documentLinks.load(params.newLinks);
//      for (let newLink of params.newLinks) {
//        $(document).trigger('ilex-updateLineage', [newLink.lineage]);  
//      }
//        that.documentLinks.load(params.newLinks, function () {
//          
//          
//          that.clearLinks();
//          //load links
//          let resolved = that.documentLinks.getResolved();
//          for (let resolvedLink of resolved) {
////            that.setLink(resolvedLink);
//            $(document).trigger('ilex-updateLineage', [resolvedLink.lineage]);   
//          }
//          
//         
//          
//          that.textEditor.allowChanges = true;
//        });
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
//    if (params.tab === windowObject.tabId &&
//        version.get() === that.getFileInfo('totalVersions')) {
//      var halfLink = params;
//      that.documentLinks.create(halfLink);
//    }
    if (params.tab === windowObject.tabId) {
      var halfLink = params;
      that.documentLinks.load([halfLink]);
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
//    var links = halfLinkTools.getIdsFromClassNames(data.span.classList);
    
//        resolvedLinks = $(data.span).data('ilex-resolvedLinks');

//    var links = [];
//    if (resolvedLinks !== undefined && resolvedLinks.length > 0) {
//      links.push(resolvedLinks[0].linkId);
//    }
    var links = [];
    for (let class_name of data.span.classList) {
      if (class_name.indexOf('ilex-lineage-') !== -1) {
        let lineage = class_name.replace(/^ilex-lineage-/, '');
        links.push(that.documentLinks.resolveLinage(lineage).linkId);
      }
    }
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
//    var haflLinks = $(this).data('ilex-links');
//    if (haflLinks !== undefined && haflLinks.length === 1) {
//        //
//      var halfLink = haflLinks[0];
//	  ilex.server.linkGetLR(halfLink, function (msg) {
//        var file = ilex.documents.get(msg.documentId),
//          linkJumps = [
//            ['standardButton', function() {
//               $(document).trigger('ilex-linkClicked', [windowObject, halfLink]);
//              }, {
//                'text': file.name,
//                'icon': '<span class="ilex-awesome">&#xf0c1;</span>'
//            }],
//		  ['separator']
//        ];
//		let menu = linkJumps.concat(textTools);
//    	ilex.popupMenu.show(event.pageY, event.pageX, menu, 220);
//	  });
//        } else {
//      let menu = textTools;
//      ilex.popupMenu.show(event.pageY, event.pageX, menu, 220);
//	}
//    var resolvedLinks = $(this).data('ilex-resolvedLinks'),
//        resolvedLink = resolvedLinks[0],
    
      var lineage = getLinageFromClassList(this.classList),
        resolved = that.documentLinks.resolveLinage(lineage),
        file = ilex.documents.get(resolved.secondHalf.documentId),
        clickPos = $(this).offset(),
        linkJumps = [
          ['standardButton', function() {
             $(document).trigger('ilex-linkClicked',
                                 [clickPos, windowObject, lineage]);
            }, {
              'text': file.name,
              'icon': '<span class="ilex-awesome">&#xf0c1;</span>'
          }],
        ['separator']
      ];
    let menu = linkJumps.concat(textTools);
    ilex.popupMenu.show(event.pageY, event.pageX, menu, 220);


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
