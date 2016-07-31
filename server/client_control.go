package main

import (
	"fmt"
	"golang.org/x/net/websocket"
)

func clear_all_data_for_socket(ws *websocket.Conn) {
	for client_tab, document_id := range Globals.ClientDoc {
		if client_tab.WS == ws {
			Globals.DocTabControlMessages[document_id] <- ClientTabClosed(client_tab)
			delete(Globals.ClientDoc, client_tab)
		}
	}
}

func ControlClients() {
	for {
		select {
		case message := <-Globals.TabControlMessages:
			fmt.Println("Received message about document", message.DocumentId, ".")
			if message.Opened {
				if !Globals.Controllers[message.DocumentId] {
					start_document_controller(message.DocumentId)
				}
				if previous_doc, ok := Globals.ClientDoc[message.ClientTab]; ok {
					// the client tab no longer uses the previous document
					Globals.DocTabControlMessages[previous_doc] <- ClientTabClosed(message.ClientTab)
				}
				Globals.ClientDoc[message.ClientTab] = message.DocumentId
				Globals.DocTabControlMessages[message.DocumentId] <- message
			} else if message.Closed {
				current_doc, ok := Globals.ClientDoc[message.ClientTab]
				if !ok {
					fmt.Println("Received an unexpected tab closing message. ")
					break
				}
				Globals.DocTabControlMessages[current_doc] <- ClientTabClosed(message.ClientTab)
				delete(Globals.ClientDoc, message.ClientTab)
			}

		case message := <-Globals.SocketControlMessages:
			clear_all_data_for_socket(message)

		case <-Globals.StopClientControl:
			fmt.Println("Stop activity")
			return
		}
	}
}
