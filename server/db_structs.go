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
	Created    string        `bson:"Created"`
	Finished   string        `bson:"Finished"`
	Size       int           `bson:"Size"`
	Addresses  [][2]int      `bson:"Addresses"`
}

type Document struct {
	Id            bson.ObjectId `bson:"_id,omitempty" json:"-"`
	Name          string        `bson:"Name"`
	Class         string        `bson:"Class"`
	Format        string        `bson:"Format"`
	Created       string        `bson:"Created"`
	Modified      string        `bson:"Modified"`
	TotalVersions int           `bson:"TotalVersions"`
}
