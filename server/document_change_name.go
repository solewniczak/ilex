package main

import (
	"golang.org/x/net/websocket"
)

const (
	DOCUMENT_CHANGE_NAME = "documentChangeName"
)

func documentChangeName(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	clientTabFloat, ok := request.Parameters[TAB].(float64)
	if !ok {
		return respond_with_nak(ws, response, "No tab id supplied!")
	}

	newName, ok := request.Parameters[NAME].(string)
	if !ok {
		return respond_with_nak(ws, response, "No name supplied!")
	}

	clientTabId := int(clientTabFloat)
	client := ClientTab{ws, clientTabId}
	docId, ok := Globals.ClientDoc[client]
	if !ok {
		return respond_with_nak(ws, response, "The tab did not have any document opened!")
	}

	Globals.DocChangeNameMessages[docId] <- &ChangeNameMessage{client, newName}
	response.Action = ACK

	return respond(ws, response)
}
