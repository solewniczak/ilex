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
		respond_with_nak(ws, response, "No tab id supplied!")
	}

	position_float, ok := request.Parameters[POSITION].(float64)
	if !ok {
		respond_with_nak(ws, response, "No position supplied!")
	}

	length_float, ok := request.Parameters[LENGTH].(float64)
	if !ok {
		respond_with_nak(ws, response, "No length supplied!")
	}

	client_tab_id := int(client_tab_float)
	client := ClientTab{ws, client_tab_id}
	position := int(position_float)
	length := int(length_float)
	doc_id, ok := client_doc[client]
	if !ok {
		respond_with_nak(ws, response, "The tab did not have any document opened!")
	}

	doc_remove_text_messages[doc_id] <- &RemoveTextMessage{client, position, length}
	response.Action = ACK

	return respond(ws, response)
}
