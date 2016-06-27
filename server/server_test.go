package main

import (
	//"fmt"
	"golang.org/x/net/websocket"
	"testing"
	"time"
)

func TestActionServer(t *testing.T) {
	go main()
	time.Sleep(time.Second)

	ws, err := websocket.Dial("ws://localhost:9000", "", "http://localhost/")
	if err != nil {
		t.Fatal("Dial", err)
	}

	var request_all IlexMessage
	request_all.Init()
	request_all.Action = REQUEST_ALL_TEXTS_INFO

	if err := websocket.JSON.Send(ws, &request_all); err != nil {
		t.Fatal("Writing", err)
	}

	var response IlexMessage
	if err := websocket.JSON.Receive(ws, &response); err != nil {
		t.Fatal("Receiving", err)
	}

	ws.Close()
	StopServer <- 1
}
