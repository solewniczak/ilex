package main

import (
	"fmt"
	"gopkg.in/mgo.v2"
)

func clear_database(database *mgo.Database) {
	// clear all
	slices := database.C("permascroll")
	slices.RemoveAll(nil)
	docs := database.C("docs")
	docs.RemoveAll(nil)
	versions := database.C("versions")
	versions.RemoveAll(nil)

	fmt.Println("Database cleared.")
}
