package main

import (
	"golang.org/x/net/websocket"
)

const (
	DOCUMENT_REMOVE_TEXT = "documentRemoveText"
)

func documentRemoveText(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	client_tab_float, ok := request.Parameters[TAB].(float64)
	if !ok {
		return respond_with_nak(ws, response, "No tab id supplied!")
	}

	position_float, ok := request.Parameters[POSITION].(float64)
	if !ok {
		return respond_with_nak(ws, response, "No position supplied!")
	}

	length_float, ok := request.Parameters[LENGTH].(float64)
	if !ok {
		return respond_with_nak(ws, response, "No length supplied!")
	}

	client_tab_id := int(client_tab_float)
	client := ClientTab{ws, client_tab_id}
	position := int(position_float)
	length := int(length_float)
	text, ok := Globals.ClientDoc[client]
	if !ok {
		return respond_with_nak(ws, response, "The tab did not have any document opened!")
	}

	Globals.DocRemoveTextMessages[text.Document] <- &RemoveTextMessage{client, position, length}
	response.Action = ACK

	return respond(ws, response)
}
