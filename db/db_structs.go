package main

import (
	"gopkg.in/mgo.v2/bson"
)

const SLICE_SIZE = 1000

type Slice struct {
	Id   bson.ObjectId `bson:"_id,omitempty"`
	No   int
	Text string
}

type Version struct {
	Id         bson.ObjectId `bson:"_id,omitempty"`
	DocumentId bson.ObjectId `bson:omitempty`
	No         int
	Created    string
	Finished   string
	Size       int
	Addresses  [][2]int
}

type Document struct {
	Id            bson.ObjectId `bson:"_id,omitempty"`
	Name          string
	Class         string
	Format        string
	Created       string
	Modified      string
	TotalVersions int
}
