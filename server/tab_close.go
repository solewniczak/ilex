package main

import (
	"golang.org/x/net/websocket"
)

const (
	TAB_CLOSE = "tabClose"
	ACK       = "ack"
)

func tabClose(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	client_tab_float, ok := request.Parameters[TAB].(float64)
	if !ok {
		respond_with_nak(ws, response, "No tab id supplied!")
	}

	client_tab := int(client_tab_float)
	TabControlMessages <- ClientTabClosed(ClientTab{ws, client_tab})
	response.Action = ACK

	return respond(ws, response)
}
