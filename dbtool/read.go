package main

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"log"
	"unicode/utf8"
)

func read_database(database *mgo.Database) {
	slices := database.C("permascroll")
	docs := database.C("docs")
	versions := database.C("versions")

	var found []Slice
	err := slices.Find(nil).All(&found)
	if err != nil {
		log.Fatal(err)
	}

	for i, slice := range found {
		fmt.Println(i, "no: ", slice.No)
		fmt.Println(i, "length: ", len(slice.Text))
		fmt.Println(i, "rune length: ", utf8.RuneCountInString(slice.Text))
	}

	var documents []Document
	err = docs.Find(nil).All(&documents)
	if err != nil {
		log.Fatal(err)
	}

	for i, doc := range documents {
		fmt.Println(i, "_id: ", doc.Id)
		fmt.Println(i, "versions: ", doc.TotalVersions)
	}

	var db_versions []Version
	err = versions.Find(nil).All(&db_versions)
	if err != nil {
		log.Fatal(err)
	}

	for i, version := range db_versions {
		fmt.Println(i, "_id: ", version.Id)
		fmt.Println(i, "DocumentId ", version.DocumentId)
		fmt.Println(i, "No: ", version.No)
		fmt.Println(i, "Name: ", version.Name)
	}
}
