'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';
if (ilex.tools.markup === undefined)
    throw 'ilex.tools.markup undefined';
if (ilex.tools.range === undefined)
    throw 'ilex.tools.range undefined';

ilex.tools.connections = {};

//link := { 'id': String, 'link':
//            [ {'vspan-set': String, 'ranges': Array of Range},
//            {'vspan-set': String, 'ranges': Array of Range} ] }

//functions creates link and adds it to ilex.view.links
//a, b - array of ranges
ilex.tools.connections.createLinkFromRanges = function (ranges1, ranges2) {
  var link = {
    'id': 'l'+ilex.view.links.length,
    'link': [
             {'vspan-set': '', 'ranges':
                ilex.tools.range.filterCollapsed(ranges1)},
             {'vspan-set': '', 'ranges':
                ilex.tools.range.filterCollapsed(ranges2)}
            ]
  };

  ilex.view.links.push(link);
  ilex.tools.markup.addConnectionTag(link);
};

//functions creates link and adds it to ilex.view.links
//doc1, doc2 - IlexDocumentObject
//vspanSet1, vspanSet2 - String - vspan-set
ilex.tools.connections.createLinkVspanSets = function (doc1, vspanSet1, doc2, vspanSet2) {
  var vspanSet1Array = ilex.tools.address.vspanSet(vspanSet1),
    vspanSet2Array = ilex.tools.address.vspanSet(vspanSet2),
    link = {
      'id': 'l'+ilex.view.links.length,
      'link': [
               {'vspanSet': vspanSet1Array, 'ranges':
                  ilex.tools.range.createFromVspanSet(doc1, vspanSet1Array)
               },
               {'vspanSet': vspanSet2Array, 'ranges':
                  ilex.tools.range.createFromVspanSet(doc2, vspanSet2Array)
               }
              ]
    };

  ilex.view.links.push(link);
  ilex.tools.markup.addConnectionTag(link);
};
