package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
)

const (
	GET_ALL_DOCUMENTS_INFO  = "getAllDocumentsInfo"
	ALL_TEXTS_INFO_RESPONSE = "allTextsInfoResponse"
	TEXTS                   = "texts"
	GETTING_INFO_FAILED     = "gettingInfoFailed"
)

type DocumentWithName struct {
	ilex.Document
	Name string `json:"name"`
}

func getAllDocumentsInfo(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		response.Action = GETTING_INFO_FAILED
		response.Parameters[ERROR] = err.Error()
		return respond(ws, response)
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	docs := database.C(ilex.DOCS)

	var found []ilex.Document
	err = docs.Find(nil).All(&found)
	if err != nil {
		fmt.Println(err)
		response.Action = GETTING_INFO_FAILED
		response.Parameters[ERROR] = err.Error()
		return respond(ws, response)
	}

	versions := database.C(ilex.VERSIONS)
	var version ilex.Version
	texts := make([]DocumentWithName, len(found))

	// Get the latest version's name as the document name.
	for i, doc := range found {
		texts[i].Document = doc
		err = versions.Find(bson.M{"DocumentId": doc.Id,
			"No": doc.TotalVersions}).One(&version)
		if err != nil {
			response.Action = GETTING_INFO_FAILED
			response.Parameters[ERROR] = "Database error! Could not find latest version for document " + doc.Id.Hex()
			return respond(ws, response)
		}
		texts[i].Name = version.Name
	}

	response.Action = ALL_TEXTS_INFO_RESPONSE
	response.Parameters[TEXTS] = texts

	return respond(ws, response)
}
