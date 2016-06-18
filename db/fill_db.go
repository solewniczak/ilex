package main

import (
	"encoding/json"
	"fmt"
	"gopkg.in/mgo.v2"
	"io/ioutil"
	"log"
)

func fill_database() {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		panic(err)
	}
	defer db_session.Close()

	// clear all
	slices := db_session.DB("default").C("permascroll")
	slices.RemoveAll(nil)
	docs := db_session.DB("default").C("docs")
	docs.RemoveAll(nil)
	versions := db_session.DB("default").C("versions")
	versions.RemoveAll(nil)

	// import slices
	buffer, err := ioutil.ReadFile("ps2.json")
	if err != nil {
		log.Fatal(err)
	}
	var sample_slices []Slice
	if err = json.Unmarshal(buffer, &sample_slices); err != nil {
		log.Fatal(err)
	}

	for _, slice := range sample_slices {
		if err = slices.Insert(slice); err != nil {
			log.Fatal(err)
		}
	}

	// import docs
	buffer, err = ioutil.ReadFile("docs.json")
	if err != nil {
		log.Fatal(err)
	}
	var sample_docs []Document
	if err = json.Unmarshal(buffer, &sample_docs); err != nil {
		log.Fatal(err)
	}

	for _, doc := range sample_docs {
		if err = docs.Insert(doc); err != nil {
			log.Fatal(err)
		}
	}

	// import versions
	buffer, err = ioutil.ReadFile("versions.json")
	if err != nil {
		log.Fatal(err)
	}
	var sample_versions []Version
	if err = json.Unmarshal(buffer, &sample_versions); err != nil {
		log.Fatal(err)
	}

	// assign versions to documents
	sample_versions[0].DocumentId = sample_docs[0].Id
	sample_versions[1].DocumentId = sample_docs[1].Id
	sample_versions[2].DocumentId = sample_docs[2].Id
	sample_versions[3].DocumentId = sample_docs[3].Id
	sample_versions[4].DocumentId = sample_docs[3].Id
	sample_versions[5].DocumentId = sample_docs[3].Id
	sample_versions[6].DocumentId = sample_docs[4].Id
	sample_versions[7].DocumentId = sample_docs[4].Id

	for _, version := range sample_versions {
		if err = versions.Insert(version); err != nil {
			log.Fatal(err)
		}
	}
}
