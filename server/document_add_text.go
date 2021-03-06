package main

import (
	"golang.org/x/net/websocket"
	"unicode/utf8"
)

const (
	DOCUMENT_ADD_TEXT = "documentAddText"
	POSITION          = "position"
	LENGTH            = "length"
	STRING            = "string"
	DOCUMENT          = "document"
	LINK_IDS          = "linkIds"
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

	addedText, ok := request.Parameters[STRING].(string)
	if !ok {
		return respond_with_nak(ws, response, "No string supplied!")
	}

	linksArray, ok := request.Parameters[LINK_IDS].([]interface{})
	if !ok {
		return respond_with_nak(ws, response, "LinkIds are supplied or are not an array!")
	}
	linkIds := make([]string, 0, len(linksArray))
	for _, link := range linksArray {
		linkAsString, ok := link.(string)
		if !ok {
			return respond_with_nak(ws, response, "LinkIds in array should be strings!")
		}
		linkIds = append(linkIds, linkAsString)
	}

	client_tab_id := int(client_tab_float)
	client := ClientTab{ws, client_tab_id}
	position := int(position_float)
	length := int(length_float)

	if utf8.RuneCount([]byte(addedText)) != length {
		return respond_with_nak(ws, response, "The supplied has wrong length!")
	}

	text, ok := Globals.ClientDoc[client]
	if !ok {
		return respond_with_nak(ws, response, "The tab did not have any document opened!")
	}

	Globals.DocAddTextMessages[text.Document] <- &AddTextMessage{client, position, length, addedText, linkIds}
	response.Action = ACK

	return respond(ws, response)
}
