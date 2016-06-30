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

func NewClientTabDoc(ws *websocket.Conn, tab_id int, doc_id string) *ClientTabDoc {
	result := new(ClientTabDoc)
	result.WS = ws
	result.TabId = tab_id
	result.DocumentId = doc_id
	return result
}
