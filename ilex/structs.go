package ilex

import (
	"gopkg.in/mgo.v2/bson"
)

type Slice struct {
	Id   bson.ObjectId `bson:"_id,omitempty" json:"-"`
	No   int           `bson:"No"`
	Text string        `bson:"Text"`
}

type Address [2]int
type AddressTable []Address

type Version struct {
	Id         bson.ObjectId `bson:"_id,omitempty" json:"-"`
	DocumentId bson.ObjectId `bson:"DocumentId"`
	No         int           `bson:"No"`
	Name       string        `bson:"Name"`
	Created    string        `bson:"Created"`
	Finished   string        `bson:"Finished"`
	Size       int           `bson:"Size"`
	Addresses  AddressTable  `bson:"Addresses"`
}

type Document struct {
	Id            bson.ObjectId `bson:"_id,omitempty" json:"id"`
	Class         string        `bson:"Class"         json:"class"`
	Format        string        `bson:"Format"        json:"format"`
	Created       string        `bson:"Created"       json:"created"`
	Modified      string        `bson:"Modified"      json:"modified"`
	TotalVersions int           `bson:"TotalVersions" json:"totalVersions"`
}

type Range struct {
	//	Id         bson.ObjectId `bson:"_id,omitempty" json:"-"`
	DocumentId bson.ObjectId `bson:"DocumentId"    json:"documentId"`
	VersionNo  int           `bson:"VersionNo"     json:"versionNo"`
	Position   int           `bson:"Position"      json:"position"`
	Length     int           `bson:"Length"        json:"length"`
}

type TwoWayLink struct {
	Id     bson.ObjectId `bson:"_id,omitempty" json:"-"`
	LinkId bson.ObjectId `bson:"LinkId"        json:"linkId"`
	From   Range         `bson:"From"          json:"from"`
	To     Range         `bson:"To"            json:"to"`
	Type   string        `bson:"Type"          json:"type"`
}
