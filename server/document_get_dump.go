package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
)

const (
	DOCUMENT_GET_DUMP = "documentGetDump"
	TAB               = "tab"
	TEXT              = "text"
	VERSION           = "version"

	DOCUMENT_RETRIEVED = "documentRetrieved"
	LINKS              = "links"
	IS_EDITABLE        = "isEditable"
	NAME               = "name"
	ID                 = "id"

	RETRIEVAL_FAILED = "retrievalFailed"
	ERROR            = "error"
)

type SimpleLink [][2]string

func documentGetDump(request *IlexMessage, ws *websocket.Conn) error {
	requested_text_id := request.Parameters[TEXT].(string)

	response := NewIlexResponse(request)

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "Document error: " + err.Error()
		return respond(ws, response)
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	docs := database.C(ilex.DOCS)

	var document ilex.Document
	err = docs.Find(bson.M{"_id": bson.ObjectIdHex(requested_text_id)}).One(&document)
	if err != nil {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "Document error: " + err.Error()
		return respond(ws, response)
	}

	// golang : all json numbers are unpacked to float64 values
	var requested_version int
	requested_version_float, ok := request.Parameters[VERSION].(float64)

	if ok {
		requested_version = int(requested_version_float)
	} else {
		requested_version = document.TotalVersions
	}

	if ok && requested_version > document.TotalVersions {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "version unavailable"
		return respond(ws, response)
	}

	var is_editable bool = false
	if requested_version == document.TotalVersions {
		is_editable = true
	}

	versions := database.C(ilex.VERSIONS)

	var version ilex.Version
	err = versions.Find(bson.M{"DocumentId": document.Id,
		"No": requested_version}).One(&version)
	if err != nil {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "Version error: " + err.Error()
		return respond(ws, response)
	}

	retrieved, err := ilex.GetStringFromAddresses(version.Addresses, version.Size, database)
	if err != nil {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = err.Error()
		return respond(ws, response)
	}

	links := database.C(ilex.LINKS)
	var doc_links []ilex.TwoWayLink
	err = links.Find(
		bson.M{"$or": []bson.M{
			bson.M{"FirstDocumentId": document.Id, "FirstVersionNo": requested_version},
			bson.M{"SecondDocumentId": document.Id, "SecondVersionNo": requested_version},
		}}).All(&doc_links)

	if err != nil {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = err.Error()
		return respond(ws, response)
	}

	client_tab_float, ok := request.Parameters[TAB].(float64)
	if !ok {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "No tab id supplied!"
		return respond(ws, response)
	}
	client_tab := int(client_tab_float)

	response.Action = DOCUMENT_RETRIEVED
	response.Parameters[TEXT] = retrieved
	response.Parameters[TAB] = client_tab
	response.Parameters[LINKS] = doc_links
	response.Parameters[IS_EDITABLE] = is_editable
	response.Parameters[NAME] = version.Name
	response.Parameters[ID] = document.Id
	TabControlMessages <- ClientTabOpenedDoc(ws, client_tab, requested_text_id)

	return respond(ws, response)
}
