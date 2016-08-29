package main

import (
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
)

const (
	DOCUMENT_GET_VERSIONS_INFO       = "documentGetVersionsInfo"
	DOCUMENT_VERSIONS_INFO_RETRIEVED = "documentVersionsInfoRetrieved"
	VERSIONS                         = "versions"
)

func documentGetVersionsInfo(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		return respond_with_nak(ws, response, "Did not find database!")
	}
	defer db_session.Close()

	documentId, ok := request.Parameters[DOCUMENT].(string)
	if !ok {
		return respond_with_nak(ws, response, "No document supplied!")
	}

	database := db_session.DB(ilex.DEFAULT_DB)
	docs := database.C(ilex.DOCS)

	var found ilex.Document
	err = docs.Find(bson.M{"_id": bson.ObjectIdHex(documentId)}).One(&found)
	if err != nil {
		return respond_with_nak(ws, response, "Could not find document"+err.Error())
	}

	if Globals.Controllers[documentId] {
		// the document is currently being edited. It's controller will respond
		// with the most accurate data
		Globals.DocGetVersionsMessages[documentId] <- &GetVersionsMessage{ws, request.Id}
		return nil
	}

	err, versions := GetAllVersions(database, &found)
	if err != nil {
		return respond_with_nak(ws, response, "Could not find versions"+err.Error())
	}

	response.Action = DOCUMENT_VERSIONS_INFO_RETRIEVED
	response.Parameters[VERSIONS] = versions
	return respond(ws, response)
}
