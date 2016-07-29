package main

import (
	"encoding/json"
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
	"io/ioutil"
	"log"
)

func fill_database(database *mgo.Database) {
	slices := database.C(ilex.PERMASCROLL)
	docs := database.C(ilex.DOCS)
	versions := database.C(ilex.VERSIONS)
	links := database.C(ilex.LINKS)

	// import slices
	buffer, err := ioutil.ReadFile("ps2.json")
	if err != nil {
		log.Fatal(err)
	}
	var sample_slices []ilex.Slice
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
	var sample_docs []ilex.Document
	if err = json.Unmarshal(buffer, &sample_docs); err != nil {
		log.Fatal(err)
	}

	for i, _ := range sample_docs {
		sample_docs[i].Id = bson.NewObjectId()
		if err = docs.Insert(sample_docs[i]); err != nil {
			log.Fatal(err)
		}
	}

	// import versions
	buffer, err = ioutil.ReadFile("versions.json")
	if err != nil {
		log.Fatal(err)
	}
	var sample_versions []ilex.Version
	if err = json.Unmarshal(buffer, &sample_versions); err != nil {
		log.Fatal(err)
	}

	// assign versions to documents.
	// (this is a hardcoded mapping)
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

	// import links
	buffer, err = ioutil.ReadFile("links.json")
	if err != nil {
		log.Fatal(err)
	}
	var sample_links []ilex.TwoWayLink
	if err = json.Unmarshal(buffer, &sample_links); err != nil {
		log.Fatal(err)
	}

	// pair documents with links
	// (this is a hardcoded mapping)
	sample_links[0].FirstDocumentId = sample_docs[0].Id
	sample_links[0].SecondDocumentId = sample_docs[3].Id
	sample_links[1].FirstDocumentId = sample_docs[1].Id
	sample_links[1].SecondDocumentId = sample_docs[3].Id
	sample_links[2].FirstDocumentId = sample_docs[1].Id
	sample_links[2].SecondDocumentId = sample_docs[3].Id
	sample_links[3].FirstDocumentId = sample_docs[3].Id
	sample_links[3].SecondDocumentId = sample_docs[4].Id
	sample_links[4].FirstDocumentId = sample_docs[3].Id
	sample_links[4].SecondDocumentId = sample_docs[4].Id
	sample_links[5].FirstDocumentId = sample_docs[3].Id
	sample_links[5].SecondDocumentId = sample_docs[4].Id
	sample_links[6].FirstDocumentId = sample_docs[3].Id
	sample_links[6].SecondDocumentId = sample_docs[4].Id
	sample_links[7].FirstDocumentId = sample_docs[3].Id
	sample_links[7].SecondDocumentId = sample_docs[4].Id
	sample_links[8].FirstDocumentId = sample_docs[3].Id
	sample_links[8].SecondDocumentId = sample_docs[4].Id
	sample_links[9].FirstDocumentId = sample_docs[3].Id
	sample_links[9].SecondDocumentId = sample_docs[4].Id
	sample_links[10].FirstDocumentId = sample_docs[3].Id
	sample_links[10].SecondDocumentId = sample_docs[4].Id
	sample_links[11].FirstDocumentId = sample_docs[4].Id
	sample_links[11].SecondDocumentId = sample_docs[2].Id
	sample_links[12].FirstDocumentId = sample_docs[4].Id
	sample_links[12].SecondDocumentId = sample_docs[2].Id

	for _, link := range sample_links {
		if err = links.Insert(link); err != nil {
			log.Fatal(err)
		}
	}

	fmt.Println("Database re-filled with sample data!")
}
