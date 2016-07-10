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
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "No tab id supplied!"
		return respond(ws, response)
	}

	client_tab := int(client_tab_float)
	TabControlMessages <- ClientTabClosed(ClientTab{ws, client_tab})
	response.Action = ACK

	return respond(ws, response)
}
