package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"testing"
	"time"
)

var REQUEST_ID int = 1

type AllTextsResponse struct {
	Action     string         `json:"action"`
	Parameters ParametersData `json:"parameters"`
}

type ParametersData struct {
	Texts []Document `json:"texts"`
}

func clientRequestsText(t *testing.T, ws *websocket.Conn, tab_id int, doc_id string) {
	request_text := NewIlexMessage()
	request_text.Action = REQUEST_TEXT_DUMP
	request_text.Id = REQUEST_ID
	REQUEST_ID++
	request_text.Parameters[TEXT] = doc_id
	request_text.Parameters[TAB] = 1

	if err := websocket.JSON.Send(ws, request_text); err != nil {
		t.Fatal("Writing text request", err)
	}

}

func TestActionServer(t *testing.T) {
	go main()
	time.Sleep(10 * time.Microsecond)

	ws, err := websocket.Dial("ws://localhost:9000", "", "http://localhost/")
	if err != nil {
		t.Fatal("Dial", err)
	}

	request_all := NewIlexMessage()
	request_all.Action = REQUEST_ALL_TEXTS_INFO
	request_all.Id = REQUEST_ID
	REQUEST_ID++

	if err := websocket.JSON.Send(ws, request_all); err != nil {
		t.Fatal("Writing", err)
	}

	var response AllTextsResponse
	if err := websocket.JSON.Receive(ws, &response); err != nil {
		t.Fatal("Receiving", err)
	}
	fmt.Println(response)

	// Tab 1 enters the fray
	clientRequestsText(t, ws, 1, response.Parameters.Texts[0].Id.String())

	time.Sleep(10 * time.Microsecond)
	ws.Close()
	time.Sleep(10 * time.Microsecond)
	StopServer <- true
}
