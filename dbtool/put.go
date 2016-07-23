package main

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
	"log"
	"time"
)

func add_doc(file_contents []byte, document_name string, database *mgo.Database) {
	slices := database.C(ilex.PERMASCROLL)
	err, document_address, text_length_runes := ilex.Persist(file_contents, slices)
	if err != nil {
		log.Fatal("Encountered error", err, ". Database may be corrupted!")
	}

	now := time.Now()
	now_as_string := now.Format(time.RFC3339)
	document := ilex.Document{bson.NewObjectId(), "utf-8 encoded text file", "plain text", now_as_string, now_as_string, 1}

	version := ilex.Version{bson.NewObjectId(), document.Id, 1, document_name, now_as_string, now_as_string, text_length_runes, ilex.AddressTable{ilex.Address{0, document_address}}}

	docs := database.C(ilex.DOCS)
	if err = docs.Insert(document); err != nil {
		log.Fatal(err)
	}

	versions := database.C(ilex.VERSIONS)
	if err = versions.Insert(version); err != nil {
		log.Fatal(err)
	}

	fmt.Println("Document >>", document_name, "<< inserted successfully!")
}
