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

	var lineages []bson.ObjectId
	for i := 0; i < 7; i++ {
		lineages = append(lineages, bson.NewObjectId())
	}

	// pair documents with links and assign lineages
	// (this is a hardcoded mapping)
	sample_links[0].Left.DocumentId = sample_docs[0].Id
	sample_links[0].Right.DocumentId = sample_docs[3].Id
	sample_links[0].Lineage = lineages[0]
	sample_links[1].Left.DocumentId = sample_docs[1].Id
	sample_links[1].Right.DocumentId = sample_docs[3].Id
	sample_links[1].Lineage = lineages[1]
	sample_links[2].Left.DocumentId = sample_docs[1].Id
	sample_links[2].Right.DocumentId = sample_docs[3].Id
	sample_links[2].Lineage = lineages[1]
	sample_links[3].Left.DocumentId = sample_docs[3].Id
	sample_links[3].Right.DocumentId = sample_docs[4].Id
	sample_links[3].Lineage = lineages[2]
	sample_links[4].Left.DocumentId = sample_docs[3].Id
	sample_links[4].Right.DocumentId = sample_docs[4].Id
	sample_links[4].Lineage = lineages[2]
	sample_links[5].Left.DocumentId = sample_docs[3].Id
	sample_links[5].Right.DocumentId = sample_docs[4].Id
	sample_links[5].Lineage = lineages[2]
	sample_links[6].Left.DocumentId = sample_docs[3].Id
	sample_links[6].Right.DocumentId = sample_docs[4].Id
	sample_links[6].Lineage = lineages[2]
	sample_links[7].Left.DocumentId = sample_docs[3].Id
	sample_links[7].Right.DocumentId = sample_docs[4].Id
	sample_links[7].Lineage = lineages[3]
	sample_links[8].Left.DocumentId = sample_docs[3].Id
	sample_links[8].Right.DocumentId = sample_docs[4].Id
	sample_links[8].Lineage = lineages[3]
	sample_links[9].Left.DocumentId = sample_docs[3].Id
	sample_links[9].Right.DocumentId = sample_docs[4].Id
	sample_links[9].Lineage = lineages[3]
	sample_links[10].Left.DocumentId = sample_docs[3].Id
	sample_links[10].Right.DocumentId = sample_docs[4].Id
	sample_links[10].Lineage = lineages[3]
	sample_links[11].Left.DocumentId = sample_docs[4].Id
	sample_links[11].Right.DocumentId = sample_docs[2].Id
	sample_links[11].Lineage = lineages[4]
	sample_links[12].Left.DocumentId = sample_docs[4].Id
	sample_links[12].Right.DocumentId = sample_docs[2].Id
	sample_links[12].Lineage = lineages[4]
	sample_links[13].Left.DocumentId = sample_docs[3].Id
	sample_links[13].Right.DocumentId = sample_docs[2].Id
	sample_links[13].Lineage = lineages[5]
	sample_links[14].Left.DocumentId = sample_docs[0].Id
	sample_links[14].Right.DocumentId = sample_docs[4].Id
	sample_links[14].Lineage = lineages[6]

	for _, link := range sample_links {
		if err = links.Insert(link); err != nil {
			log.Fatal(err)
		}
	}

	fmt.Println("Database re-filled with sample data!")
}
