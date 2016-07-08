package main

import (
	"golang.org/x/net/websocket"
)

type ClientTab struct {
	WS    *websocket.Conn
	TabId int
}

type ClientTabMessage struct {
	ClientTab
	Opened     bool
	DocumentId string
	Closed     bool
}

func ClientTabOpenedDoc(ws *websocket.Conn, tab_id int, doc_id string) *ClientTabMessage {
	result := new(ClientTabMessage)
	result.WS = ws
	result.TabId = tab_id
	result.DocumentId = doc_id
	result.Opened = true
	result.Closed = false
	return result
}

func ClientTabClosed(ws *websocket.Conn, tab_id int) *ClientTabMessage {
	result := new(ClientTabMessage)
	result.WS = ws
	result.TabId = tab_id
	result.Opened = false
	result.Closed = true
	return result
}
