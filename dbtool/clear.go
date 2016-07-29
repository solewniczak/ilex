package main

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
)

func clear_database(database *mgo.Database) {
	// clear all
	slices := database.C(ilex.PERMASCROLL)
	slices.RemoveAll(nil)
	docs := database.C(ilex.DOCS)
	docs.RemoveAll(nil)
	versions := database.C(ilex.VERSIONS)
	versions.RemoveAll(nil)
	links := database.C(ilex.LINKS)
	links.RemoveAll(nil)

	fmt.Println("Database cleared.")
}
