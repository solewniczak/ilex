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
	Position int `bson:"Position"      json:"position"`
	Length   int `bson:"Length"        json:"length"`
}

type Anchor struct {
	DocumentId bson.ObjectId `bson:"DocumentId" json:"documentId"`
	VersionNo  int           `bson:"VersionNo"  json:"versionNo"`
	Range      Range         `bson:"Range"      json:"range"`
	Type       string        `bson:"Type"       json:"type"`
}

// a TwoWayLink consists of two Anchors
type TwoWayLink struct {
	Id     bson.ObjectId `bson:"_id,omitempty" json:"id"`
	LinkId bson.ObjectId `bson:"LinkId"        json:"linkId"`
	Left   Anchor        `bson:"Left"          json:"left"`
	Right  Anchor        `bson:"Right"         json:"right"`
}

// A HalfLink is a standalone Anchor
type HalfLink struct {
	Anchor
	LinkId bson.ObjectId `json:"linkId"`
	IsLeft bool          `json:"isLeft"`
}
