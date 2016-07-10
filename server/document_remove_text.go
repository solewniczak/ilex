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
		response.Action = NAK
		response.Parameters[ERROR] = "No tab id supplied!"
		return respond(ws, response)
	}

	position_float, ok := request.Parameters[POSITION].(float64)
	if !ok {
		response.Action = NAK
		response.Parameters[ERROR] = "No position supplied!"
		return respond(ws, response)
	}

	length_float, ok := request.Parameters[LENGTH].(float64)
	if !ok {
		response.Action = NAK
		response.Parameters[ERROR] = "No length supplied!"
		return respond(ws, response)
	}

	client_tab_id := int(client_tab_float)
	client := ClientTab{ws, client_tab_id}
	position := int(position_float)
	length := int(length_float)
	doc_id, ok := client_doc[client]
	if !ok {
		response.Action = NAK
		response.Parameters[ERROR] = "The tab did not have any document opened!"
		return respond(ws, response)
	}

	doc_remove_text_messages[doc_id] <- &RemoveTextMessage{client, position, length}
	response.Action = ACK

	return respond(ws, response)
}
