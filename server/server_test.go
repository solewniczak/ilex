package main

import (
	//"fmt"
	"golang.org/x/net/websocket"
	"testing"
	"time"
)

const interval time.Duration = 40 * time.Microsecond

var REQUEST_ID int = 1

type AllTextsResponse struct {
	Action     string                 `json:"action"`
	Parameters AllTextsParametersData `json:"parameters"`
	Id         int                    `json:"id"`
}

type AllTextsParametersData struct {
	Texts []DocumentWithName `json:"texts"`
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
	request_text.Action = DOCUMENT_GET_DUMP
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

	if response.Action != DOCUMENT_RETRIEVED || response.Id != REQUEST_ID || response.Parameters.Tab != tab_id {
		t.Fatal("Wrong response:", response)
	}

	REQUEST_ID++
}

func verify_clients(t *testing.T, expected map[string]int) {
	for doc, clients := range expected {
		actual_clients, ok := doc_clients[doc]
		if len(actual_clients) != clients || !ok {
			t.Fatal("Client connections data is incorrect! Too little connections!")
		}
		for _, client := range actual_clients {
			if client_document, ok := client_doc[client]; client_document != doc || !ok {
				t.Fatal("Client connections data is inconsistent!")
			}
		}
	}
}

func TestActionServer(t *testing.T) {
	go main()
	time.Sleep(interval)

	ws1, err := websocket.Dial("ws://localhost:9000", "", "http://localhost/1")
	if err != nil {
		t.Fatal("Dial", err)
	}

	request_all := NewIlexMessage()
	request_all.Action = GET_ALL_DOCUMENTS_INFO
	request_all.Id = REQUEST_ID

	if err := websocket.JSON.Send(ws1, request_all); err != nil {
		t.Fatal("Writing", err)
	}

	var response AllTextsResponse
	if err := websocket.JSON.Receive(ws1, &response); err != nil {
		t.Fatal("Receiving all texts", err)
	}

	if response.Action != ALL_TEXTS_INFO_RESPONSE || response.Id != REQUEST_ID {
		t.Fatal("Wrong response:", response)
	}
	REQUEST_ID++

	// Client Tab 1 enters the fray
	clientRequestsText(t, ws1, 1, response.Parameters.Texts[0].Id.Hex())
	time.Sleep(interval)
	verify_clients(t, map[string]int{response.Parameters.Texts[0].Id.Hex(): 1})

	// Client Tab 2
	clientRequestsText(t, ws1, 2, response.Parameters.Texts[1].Id.Hex())
	time.Sleep(interval)
	verify_clients(t, map[string]int{response.Parameters.Texts[0].Id.Hex(): 1, response.Parameters.Texts[1].Id.Hex(): 1})

	// Client Tab 1 requests the same text as tab 2
	clientRequestsText(t, ws1, 1, response.Parameters.Texts[1].Id.Hex())
	time.Sleep(interval)
	verify_clients(t, map[string]int{response.Parameters.Texts[0].Id.Hex(): 0, response.Parameters.Texts[1].Id.Hex(): 2})

	// Client 2 appears!
	ws2, err := websocket.Dial("ws://localhost:9000", "", "http://localhost/2")
	if err != nil {
		t.Fatal("Dial", err)
	}

	// Client 2 tab 1
	clientRequestsText(t, ws2, 1, response.Parameters.Texts[0].Id.Hex())
	time.Sleep(interval)
	verify_clients(t, map[string]int{response.Parameters.Texts[0].Id.Hex(): 1, response.Parameters.Texts[1].Id.Hex(): 2})

	clientRequestsText(t, ws2, 1, response.Parameters.Texts[1].Id.Hex())
	time.Sleep(interval)
	verify_clients(t, map[string]int{response.Parameters.Texts[0].Id.Hex(): 0, response.Parameters.Texts[1].Id.Hex(): 3})

	time.Sleep(interval)
	ws1.Close()
	ws2.Close()
	time.Sleep(interval)
	StopServer <- true
}
