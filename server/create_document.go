package main

import (
	"golang.org/x/net/websocket"
)

const (
	CREATE_DOCUMENT  = "createDocument"
	DOCUMENT_CREATED = "documentCreated"
	CLASS            = "class"
	DEFAULT_CLASS    = "utf-8 encoded text file"
	FORMAT           = "format"
	DEFAULT_FORMAT   = "plain text"
)

func createDocument(request *IlexMessage, ws *websocket.Conn) error {

	var clientTab ClientTab
	clientTabFloat, ok := request.Parameters[TAB].(float64)
	if ok {
		clientTab = ClientTab{ws, int(clientTabFloat)}
	}

	name, ok := request.Parameters[NAME].(string)
	if !ok {
		name = ""
	}

	text, ok := request.Parameters[TEXT].(string)
	if !ok {
		text = ""
	}

	class, ok := request.Parameters[CLASS].(string)
	if !ok {
		class = DEFAULT_CLASS
	}

	format, ok := request.Parameters[FORMAT].(string)
	if !ok {
		format = DEFAULT_FORMAT
	}

	Globals.NewDocumentRequests <- &NewDocumentRequest{clientTab, name, class, format, text, request.Id}
	return nil
}
