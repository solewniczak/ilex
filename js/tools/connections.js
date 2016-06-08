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
  var link = {
    'id': 'l'+ilex.view.links.length,
    'link': [
             {'vspan-set': vspanSet1, 'ranges':
                ilex.tools.range.createFromVspanSet(doc1, vspanSet1)},
             {'vspan-set': vspanSet2, 'ranges':
                ilex.tools.range.createFromVspanSet(doc2, vspanSet2)}
            ]
  };

  ilex.view.links.push(link);
  ilex.tools.markup.addConnectionTag(link);
};
