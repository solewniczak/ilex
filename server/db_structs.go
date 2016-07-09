package main

import (
	"gopkg.in/mgo.v2/bson"
)

const SLICE_SIZE = 1000

type Slice struct {
	Id   bson.ObjectId `bson:"_id,omitempty" json:"-"`
	No   int           `bson:"No"`
	Text string        `bson:"Text"`
}

type Version struct {
	Id         bson.ObjectId `bson:"_id,omitempty" json:"-"`
	DocumentId bson.ObjectId `bson:"DocumentId"`
	No         int           `bson:"No"`
	Name       string        `bson:"Name"`
	Created    string        `bson:"Created"`
	Finished   string        `bson:"Finished"`
	Size       int           `bson:"Size"`
	Addresses  [][2]int      `bson:"Addresses"`
}

type Document struct {
	Id            bson.ObjectId `bson:"_id,omitempty" json:"id"`
	Class         string        `bson:"Class"         json:"class"`
	Format        string        `bson:"Format"        json:"format"`
	Created       string        `bson:"Created"       json:"created"`
	Modified      string        `bson:"Modified"      json:"modified"`
	TotalVersions int           `bson:"TotalVersions" json:"totalVersions"`
}
