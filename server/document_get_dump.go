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
	response := NewIlexResponse(request)

	requestedTextId, ok := request.Parameters[TEXT].(string)
	if !ok {
		respond_with_nak(ws, response, "No document id supplied!")
	}

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
	err = docs.Find(bson.M{"_id": bson.ObjectIdHex(requestedTextId)}).One(&document)
	if err != nil {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "Document error: " + err.Error()
		return respond(ws, response)
	}

	// golang : all json numbers are unpacked to float64 values

	client_tab_float, ok := request.Parameters[TAB].(float64)
	if !ok {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "No tab id supplied!"
		return respond(ws, response)
	}
	client_tab := int(client_tab_float)

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
		if Globals.Controllers[requestedTextId] {
			// the version is currently being created
			Globals.DocGetDumpMessages[requestedTextId] <- &GetDumpMessage{ClientTab{ws, client_tab}, requested_version, request.Id}
			Globals.TabControlMessages <- ClientTabOpenedDoc(ws, client_tab, requestedTextId, requested_version)
			return nil
		}
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

	err, doc_links := ilex.GetLinksForDoc(database, &document.Id, requested_version)
	if err != nil {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = err.Error()
		return respond(ws, response)
	}

	response.Action = DOCUMENT_RETRIEVED
	response.Parameters[TEXT] = retrieved
	response.Parameters[TAB] = client_tab
	response.Parameters[LINKS] = doc_links
	response.Parameters[IS_EDITABLE] = is_editable
	response.Parameters[NAME] = version.Name
	response.Parameters[ID] = document.Id
	Globals.TabControlMessages <- ClientTabOpenedDoc(ws, client_tab, requestedTextId, requested_version)

	return respond(ws, response)
}
