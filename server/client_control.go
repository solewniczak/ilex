package main

import (
	"fmt"
	"golang.org/x/net/websocket"
)

var SocketControlMessages chan *websocket.Conn = make(chan *websocket.Conn)
var TabControlMessages chan *ClientTabMessage = make(chan *ClientTabMessage)
var client_doc map[ClientTab]string = make(map[ClientTab]string)

func clear_all_data_for_socket(ws *websocket.Conn) {
	for client_tab, document_id := range client_doc {
		if client_tab.WS == ws {
			doc_tab_control_messages[document_id] <- ClientTabClosed(client_tab)
			delete(client_doc, client_tab)
		}
	}
}

func ControlClients(stop_client_control chan bool) {
	for {
		select {
		case message := <-TabControlMessages:
			if !controllers[message.DocumentId] {
				start_document_controller(message.DocumentId)
			}
			if message.Opened {
				if previous_doc, ok := client_doc[message.ClientTab]; ok {
					// the client tab no longer uses the previous document
					doc_tab_control_messages[previous_doc] <- ClientTabClosed(message.ClientTab)
				}
				client_doc[message.ClientTab] = message.DocumentId
				doc_tab_control_messages[message.DocumentId] <- message
			} else if message.Closed {
				current_doc, ok := client_doc[message.ClientTab]
				if !ok {
					fmt.Println("Received an unexpected tab closing message. ")
					break
				}
				doc_tab_control_messages[current_doc] <- ClientTabClosed(message.ClientTab)
				delete(client_doc, message.ClientTab)
			}

		case message := <-SocketControlMessages:
			clear_all_data_for_socket(message)

		case <-stop_client_control:
			fmt.Println("Stop activity")
			return
		}
	}
}
