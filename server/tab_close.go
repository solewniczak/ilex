package main

import (
	"encoding/json"
	"fmt"
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
		goto send
	}

	{
		client_tab := int(client_tab_float)
		TabControlMessages <- ClientTabClosed(ws, client_tab)
		response.Action = ACK
	}

send:
	js, _ := json.Marshal(response)
	fmt.Println("sending response: ", string(js))
	return websocket.JSON.Send(ws, response)
}
