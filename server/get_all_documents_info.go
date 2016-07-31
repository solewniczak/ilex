package main

import (
	"golang.org/x/net/websocket"
)

const (
	GET_ALL_DOCUMENTS_INFO  = "getAllDocumentsInfo"
	ALL_TEXTS_INFO_RESPONSE = "allTextsInfoResponse"
	TEXTS                   = "texts"
	GETTING_INFO_FAILED     = "gettingInfoFailed"
)

func getAllDocumentsInfo(request *IlexMessage, ws *websocket.Conn) error {
	Globals.AllDocumentRequests <- &AllDocumentsRequest{ws, request.Id}
	return nil
}
