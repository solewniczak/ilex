package main

import (
	"golang.org/x/net/websocket"
)

type ClientTab struct {
	WS    *websocket.Conn
	TabId int
}

type ClientTabDoc struct {
	ClientTab
	DocumentId string
}

func NewClientTabDoc(client_tab *ClientTab, doc_id string) *ClientTabDoc {
	result := new(ClientTabDoc)
	result.ClientTab = *client_tab
	result.DocumentId = doc_id
	return result
}
