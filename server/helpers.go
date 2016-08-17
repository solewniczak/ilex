package main

import (
	"errors"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
)

func GetLatestVersion(database *mgo.Database, doc *ilex.Document, version *ilex.Version) error {
	versions := database.C(VERSIONS)
	return versions.Find(bson.M{"DocumentId": doc.Id, "No": doc.TotalVersions}).One(&version)
}

func GetAllVersions(database *mgo.Database, doc *ilex.Document) (error, []ilex.Version) {
	versions := database.C(VERSIONS)
	var found []ilex.Version
	err := versions.Find(bson.M{"DocumentId": doc.Id}).All(&found)
	return err, found
}

func UpdateDocument(docs *mgo.Collection, doc *ilex.Document, version *ilex.Version) error {
	if version.No > doc.TotalVersions+1 || version.No < doc.TotalVersions {
		return errors.New("Document info and it's new version do not match!")
	}
	doc.TotalVersions = version.No
	if version.Finished > version.Created {
		doc.Modified = version.Finished
	} else {
		doc.Modified = version.Created
	}
	return docs.UpdateId(doc.Id, bson.M{"$set": bson.M{"Modified": doc.Modified, "TotalVersions": version.No}})
}

func GetLinksForDoc(database *mgo.Database, documentId string, version int) (error, []ilex.TwoWayLink) {
	links := database.C(LINKS)
	var doc_links []ilex.TwoWayLink
	err := links.Find(
		bson.M{"$or": []bson.M{
			bson.M{"FirstDocumentId": documentId, "FirstVersionNo": version},
			bson.M{"SecondDocumentId": documentId, "SecondVersionNo": version},
		}}).All(&doc_links)
	return err, doc_links
}
