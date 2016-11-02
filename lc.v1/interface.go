package lc

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
	"sort"
)

type LinkContainer interface {
	AddRunes(position, length int, linkIds []string)
	RemoveRunes(position, length int) (removed []ilex.TwoWayLink)
	Persist(db *mgo.Database) error
	Propagate(db *mgo.Database) //should return new links for document and its neighbours
}

func NewLinkContainer(documentId *bson.ObjectId, version int, db *mgo.Database) LinkContainer {
	err, docLinks := ilex.GetLinksForDoc(db, documentId, version)
	if err != nil {
		fmt.Println("DB error creating links container:", err.Error())
		return nil
	}
	//result := new(TwoWayLinkContainer)
	//result.Links = docLinks
	//result.ToDelete = make([]ilex.TwoWayLink, 0)
	result := TwoWayLinkContainer{Links: docLinks, ToDelete: make([]ilex.TwoWayLink, 0)}
	sort.Sort(result)
	return &result
}
