package main

import (
	"fmt"
	"golang.org/x/net/websocket"
)

var SocketControlMessages chan *websocket.Conn = make(chan *websocket.Conn)
var TabControlMessages chan *ClientTabMessage = make(chan *ClientTabMessage)
var client_doc map[ClientTab]string = make(map[ClientTab]string)
var doc_clients map[string]([]ClientTab) = make(map[string]([]ClientTab))

func remove_client_tab_from_doc(doc_id string, client_tab *ClientTab) {
	var pos int = -1
	old_clients, ok := doc_clients[doc_id]
	if !ok {
		panic("Client connections data is incoherent!")
	}
	for i, val := range old_clients {
		if val == *client_tab {
			pos = i
		}
	}
	if pos == -1 {
		panic("Client connections data is incoherent!")
	}
	new_clients := make([]ClientTab, len(old_clients)-1)
	copy(new_clients, old_clients[0:pos])
	copy(new_clients[pos:], old_clients[pos+1:])
	doc_clients[doc_id] = new_clients
}

func add_client_tab_to_doc(doc_id string, client_tab *ClientTab) {
	clients, ok := doc_clients[doc_id]
	if !ok {
		// there was no clients slice
		clients := make([]ClientTab, 1, 2)
		clients[0] = *client_tab
		doc_clients[doc_id] = clients
	} else {
		// append to clients
		l := len(clients)
		if l+1 > cap(clients) {
			new_clients := make([]ClientTab, 2*(l+1))
			copy(new_clients, clients)
			clients = new_clients[:l]
		}
		clients = clients[:l+1]
		clients[l] = *client_tab
		doc_clients[doc_id] = clients
	}
}

func clear_all_data_for_socket(ws *websocket.Conn) {
	for client_tab, _ := range client_doc {
		if client_tab.WS == ws {
			delete(client_doc, client_tab)
		}
	}
	for doc, client_tabs := range doc_clients {
		for i, client_tab := range client_tabs {
			if client_tab.WS == ws {
				remove_client_tab_from_doc(doc, &client_tabs[i])
			}
		}
	}
}

func ControlClients(stop_client_control chan bool) {
	for {
		select {
		case message := <-TabControlMessages:
			if message.Opened {
				previous_doc, ok := client_doc[message.ClientTab]
				if ok {
					// the client tab no longer uses the previous document
					remove_client_tab_from_doc(previous_doc, &message.ClientTab)
					fmt.Println("Client tab", message.ClientTab, "closed doc", previous_doc)
				}
				client_doc[message.ClientTab] = message.DocumentId
				add_client_tab_to_doc(message.DocumentId, &message.ClientTab)
				fmt.Println("Client tab", message.ClientTab, "opened doc", message.DocumentId)
			} else if message.Closed {
				previous_doc, ok := client_doc[message.ClientTab]
				if ok {
					// the client tab no longer uses the previous document
					remove_client_tab_from_doc(previous_doc, &message.ClientTab)
					fmt.Println("Client tab", message.ClientTab, "closed doc", previous_doc)
				} else {
					fmt.Println("Received an unexpected tabClose message. Client tab did not have any documents opened.")
				}
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
