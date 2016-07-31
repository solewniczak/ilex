package main

import (
	"golang.org/x/net/websocket"
)

const (
	DOCUMENT_ADD_TEXT = "documentAddText"
	POSITION          = "position"
	LENGTH            = "length"
	STRING            = "string"
	DOCUMENT          = "document"
	NAK               = "nak"
)

func documentAddText(request *IlexMessage, ws *websocket.Conn) error {
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

	text, ok := request.Parameters[STRING].(string)
	if !ok {
		return respond_with_nak(ws, response, "No string supplied!")
	}

	client_tab_id := int(client_tab_float)
	client := ClientTab{ws, client_tab_id}
	position := int(position_float)
	length := int(length_float)

	if len(text) != length {
		return respond_with_nak(ws, response, "The supplied has wrong length!")
	}

	doc_id, ok := Globals.ClientDoc[client]
	if !ok {
		return respond_with_nak(ws, response, "The tab did not have any document opened!")
	}

	Globals.DocAddTextMessages[doc_id] <- &AddTextMessage{client, position, length, text}
	response.Action = ACK

	return respond(ws, response)

}
