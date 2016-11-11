package lc

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
	"sort"
)

type LinkContainer interface {
	GetCurrent() []ilex.HalfLink
	AddRunes(position, length int, linkIds []string) error
	RemoveRunes(position, length int)
	Persist(db *mgo.Database) error
	Propagate(db *mgo.Database) //should return new links for document and its neighbours
}

func NewLinkContainer(documentId *bson.ObjectId, version int, db *mgo.Database) LinkContainer {
	err, docLinks := ilex.GetLinksForDoc(db, documentId, version)
	if err != nil {
		fmt.Println("DB error creating links container:", err.Error())
		return nil
	}
	result := HalfLinkContainer{Links: docLinks, ToDelete: make([]ilex.HalfLink, 0)}
	sort.Sort(result)
	result.print()
	return &result
}
