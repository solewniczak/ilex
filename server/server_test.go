package main

import (
	//"fmt"
	"golang.org/x/net/websocket"
	"testing"
	"time"
)

var REQUEST_ID int = 1

type AllTextsResponse struct {
	Action     string                 `json:"action"`
	Parameters AllTextsParametersData `json:"parameters"`
	Id         int                    `json:"id"`
}

type AllTextsParametersData struct {
	Texts []Document `json:"texts"`
}

type TextDumpResponse struct {
	Action     string                 `json:"action"`
	Parameters TextDumpParametersData `json:"parameters"`
	Id         int                    `json:"id"`
}

type TextDumpParametersData struct {
	Links SimpleLink `json:"links"`
	Text  string     `json:"text"`
	Tab   int        `json:"tab"`
}

func clientRequestsText(t *testing.T, ws *websocket.Conn, tab_id int, doc_id string) {
	request_text := NewIlexMessage()
	request_text.Action = REQUEST_TEXT_DUMP
	request_text.Id = REQUEST_ID
	request_text.Parameters[TEXT] = doc_id
	request_text.Parameters[TAB] = tab_id

	if err := websocket.JSON.Send(ws, request_text); err != nil {
		t.Fatal("Writing text request", err)
	}

	var response TextDumpResponse
	if err := websocket.JSON.Receive(ws, &response); err != nil {
		t.Fatal("Receiving text dump", err)
	}

	if response.Action != TEXT_RETRIEVED || response.Id != REQUEST_ID || response.Parameters.Tab != tab_id {
		t.Fatal("Wrong response:", response)
	}

	REQUEST_ID++
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

	if err := websocket.JSON.Send(ws, request_all); err != nil {
		t.Fatal("Writing", err)
	}

	var response AllTextsResponse
	if err := websocket.JSON.Receive(ws, &response); err != nil {
		t.Fatal("Receiving all texts", err)
	}

	if response.Action != ALL_TEXTS_INFO_RESPONSE || response.Id != REQUEST_ID {
		t.Fatal("Wrong response:", response)
	}
	REQUEST_ID++

	// Tab 1 enters the fray
	clientRequestsText(t, ws, 1, response.Parameters.Texts[0].Id.String())

	time.Sleep(10 * time.Microsecond)
	ws.Close()
	time.Sleep(10 * time.Microsecond)
	StopServer <- true
}
