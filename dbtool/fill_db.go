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

	var linkIds []bson.ObjectId
	for i := 0; i < 7; i++ {
		linkIds = append(linkIds, bson.NewObjectId())
	}

	// pair documents with links and assign linkIds
	// (this is a hardcoded mapping)
	sample_links[0].From.DocumentId = sample_docs[0].Id
	sample_links[0].To.DocumentId = sample_docs[3].Id
	sample_links[0].LinkId = linkIds[0]
	sample_links[1].From.DocumentId = sample_docs[1].Id
	sample_links[1].To.DocumentId = sample_docs[3].Id
	sample_links[1].LinkId = linkIds[1]
	sample_links[2].From.DocumentId = sample_docs[1].Id
	sample_links[2].To.DocumentId = sample_docs[3].Id
	sample_links[2].LinkId = linkIds[1]
	sample_links[3].From.DocumentId = sample_docs[3].Id
	sample_links[3].To.DocumentId = sample_docs[4].Id
	sample_links[3].LinkId = linkIds[2]
	sample_links[4].From.DocumentId = sample_docs[3].Id
	sample_links[4].To.DocumentId = sample_docs[4].Id
	sample_links[4].LinkId = linkIds[2]
	sample_links[5].From.DocumentId = sample_docs[3].Id
	sample_links[5].To.DocumentId = sample_docs[4].Id
	sample_links[5].LinkId = linkIds[2]
	sample_links[6].From.DocumentId = sample_docs[3].Id
	sample_links[6].To.DocumentId = sample_docs[4].Id
	sample_links[6].LinkId = linkIds[2]
	sample_links[7].From.DocumentId = sample_docs[3].Id
	sample_links[7].To.DocumentId = sample_docs[4].Id
	sample_links[7].LinkId = linkIds[3]
	sample_links[8].From.DocumentId = sample_docs[3].Id
	sample_links[8].To.DocumentId = sample_docs[4].Id
	sample_links[8].LinkId = linkIds[3]
	sample_links[9].From.DocumentId = sample_docs[3].Id
	sample_links[9].To.DocumentId = sample_docs[4].Id
	sample_links[9].LinkId = linkIds[3]
	sample_links[10].From.DocumentId = sample_docs[3].Id
	sample_links[10].To.DocumentId = sample_docs[4].Id
	sample_links[10].LinkId = linkIds[3]
	sample_links[11].From.DocumentId = sample_docs[4].Id
	sample_links[11].To.DocumentId = sample_docs[2].Id
	sample_links[11].LinkId = linkIds[4]
	sample_links[12].From.DocumentId = sample_docs[4].Id
	sample_links[12].To.DocumentId = sample_docs[2].Id
	sample_links[12].LinkId = linkIds[4]
	sample_links[13].From.DocumentId = sample_docs[3].Id
	sample_links[13].To.DocumentId = sample_docs[2].Id
	sample_links[13].LinkId = linkIds[5]
	sample_links[14].From.DocumentId = sample_docs[0].Id
	sample_links[14].To.DocumentId = sample_docs[4].Id
	sample_links[14].LinkId = linkIds[6]

	for _, link := range sample_links {
		if err = links.Insert(link); err != nil {
			log.Fatal(err)
		}
	}

	fmt.Println("Database re-filled with sample data!")
}
