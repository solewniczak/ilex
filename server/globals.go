package main

import (
	"golang.org/x/net/websocket"
)

var Globals = struct {
	StopServer              chan interface{}
	StopClientControl       chan interface{}
	StopDocumentsView       chan interface{}
	SocketControlMessages   chan *websocket.Conn
	TabControlMessages      chan *ClientTabMessage
	AllDocumentRequests     chan *AllDocumentsRequest
	DocumentUpdatedMessages chan *DocumentUpdate
	DocAddTextMessages      map[string](chan *AddTextMessage)
	DocRemoveTextMessages   map[string](chan *RemoveTextMessage)
	DocTabControlMessages   map[string](chan *ClientTabMessage)
	DocGetDumpMessages      map[string](chan *GetDumpMessage)
	DocGetVersionsMessages  map[string](chan *GetVersionsMessage)
	Controllers             map[string]bool
	ClientDoc               map[ClientTab]string
}{
	StopServer:              make(chan interface{}),
	StopClientControl:       make(chan interface{}),
	StopDocumentsView:       make(chan interface{}),
	SocketControlMessages:   make(chan *websocket.Conn),
	TabControlMessages:      make(chan *ClientTabMessage),
	AllDocumentRequests:     make(chan *AllDocumentsRequest),
	DocumentUpdatedMessages: make(chan *DocumentUpdate),
	DocAddTextMessages:      make(map[string](chan *AddTextMessage)),
	DocRemoveTextMessages:   make(map[string](chan *RemoveTextMessage)),
	DocTabControlMessages:   make(map[string](chan *ClientTabMessage)),
	DocGetDumpMessages:      make(map[string](chan *GetDumpMessage)),
	DocGetVersionsMessages:  make(map[string](chan *GetVersionsMessage)),
	Controllers:             make(map[string]bool),
	ClientDoc:               make(map[ClientTab]string),
}
