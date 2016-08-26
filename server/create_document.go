package main

import (
	"golang.org/x/net/websocket"
)

const (
	CREATE_DOCUMENT  = "createDocument"
	DOCUMENT_CREATED = "documentCreated"
)

func createDocument(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	clientTabFloat, ok := request.Parameters[TAB].(float64)
	if !ok {
		return respond_with_nak(ws, response, "No tab id supplied!")
	}

	name, ok := request.Parameters[NAME].(string)
	if !ok {
		return respond_with_nak(ws, response, "No name supplied!")
	}

	clientTabId := int(clientTabFloat)
	Globals.NewDocumentRequests <- &NewDocumentRequest{ClientTab{ws, clientTabId}, name, request.Id}
	return nil
}
