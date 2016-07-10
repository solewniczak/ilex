package main

import (
	"fmt"
	//	"golang.org/x/net/websocket"
	//	"gopkg.in/mgo.v2"
)

type AddTextMessage struct {
	Client   ClientTab
	Position int
	Length   int
	String   string
}

type RemoveTextMessage struct {
	Client   ClientTab
	Position int
	Length   int
}

var doc_add_text_messages map[string](chan *AddTextMessage) = make(map[string](chan *AddTextMessage))
var doc_remove_text_messages map[string](chan *RemoveTextMessage) = make(map[string](chan *RemoveTextMessage))
var doc_tab_control_messages map[string](chan *ClientTabMessage) = make(map[string](chan *ClientTabMessage))

var controllers map[string]bool = make(map[string]bool)

func control_document(document_id string, add_text_messages chan *AddTextMessage, remove_text_messages chan *RemoveTextMessage, tab_control_messages chan *ClientTabMessage) {
	clients := make(map[ClientTab]bool)
	total_clients := 0

loop:
	for {
		select {
		case message := <-add_text_messages:
			fmt.Println("text added", *message)

		case message := <-remove_text_messages:
			fmt.Println("text removed", *message)

		case message := <-tab_control_messages:
			{
				fmt.Println("a client connected or disconnected")
				if message.Opened {
					if clients[message.ClientTab] {
						fmt.Println("Received an unexpected document opened message. Document did not have the tab registered as a client.")
					} else {
						clients[message.ClientTab] = true
						total_clients++
						fmt.Println("Client tab", message.ClientTab, "opened doc", document_id)
					}
				} else if message.Closed {
					if !clients[message.ClientTab] {
						fmt.Println("Received an unexpected document closing message. Document did not have the tab registered as a client.")
					} else {
						clients[message.ClientTab] = false
						fmt.Println("Client tab", message.ClientTab, "closed doc", document_id)
						total_clients--
						if total_clients == 0 {
							break loop
						}
					}
				}
			}
		}
	}
	fmt.Println("Document controller for ", document_id, " is shutting down.")
	close(doc_add_text_messages[document_id])
	close(doc_remove_text_messages[document_id])
	close(doc_tab_control_messages[document_id])
	controllers[document_id] = false
}

func start_document_controller(document_id string) {
	if controllers[document_id] {
		fmt.Println("Document controller for ", document_id, " already exists")
		return
	}
	add_text_messages := make(chan *AddTextMessage)
	remove_text_messages := make(chan *RemoveTextMessage)
	tab_control_messages := make(chan *ClientTabMessage)

	go control_document(document_id, add_text_messages, remove_text_messages, tab_control_messages)

	doc_add_text_messages[document_id] = add_text_messages
	doc_remove_text_messages[document_id] = remove_text_messages
	doc_tab_control_messages[document_id] = tab_control_messages
	controllers[document_id] = true
}
