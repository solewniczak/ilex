package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
)

// the backticks are hints for the golang JSON marshaller -
// - names of the struct's json fields
type IlexMessage struct {
	Action     string                 `json:"action"`
	Parameters map[string]interface{} `json:"parameters"`
	Id         int                    `json:"id"`
}

func NewIlexMessage() *IlexMessage {
	im := new(IlexMessage)
	im.Parameters = make(map[string]interface{})
	return im
}

func NewIlexResponse(request *IlexMessage) *IlexMessage {
	im := NewIlexMessage()
	im.Id = request.Id
	return im
}

type Notification struct {
	Notification string                 `json:"notification"`
	Parameters   map[string]interface{} `json:"parameters"`
	Id           int                    `json:"id"`
}

func NewNotification() *Notification {
	var n Notification
	n.Parameters = make(map[string]interface{})
	n.Id = Globals.Counter.GetNew()
	return &n
}

func (n *Notification) SendTo(ws *websocket.Conn) error {
	js, _ := json.Marshal(n)
	fmt.Println("sending notification", string(js), "to", *ws)
	return websocket.JSON.Send(ws, n)
}

func NewTabNotification(tabId int) *Notification {
	n := NewNotification()
	n.Parameters[TAB] = tabId
	return n
}
