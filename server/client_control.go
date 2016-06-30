package main

import (
	"fmt"
)

var ClientControlMessages chan *ClientTabDoc = make(chan *ClientTabDoc)
var client_doc map[ClientTab]string = make(map[ClientTab]string)
var doc_clients map[string]([]ClientTab) = make(map[string]([]ClientTab))

func remove_client_tab_from_doc(doc_id string, client_tab *ClientTab) {
	var pos int = -1
	old_docs, ok := doc_clients[doc_id]
	if !ok {
		panic("Client connections data is incoherent!")
	}
	for i, val := range old_docs {
		if val == *client_tab {
			pos = i
		}
	}
	if pos == -1 {
		panic("Client connections data is incoherent!")
	}
	new_docs := make([]ClientTab, len(old_docs)-1)
	copy(new_docs, old_docs[0:pos])
	copy(new_docs[pos:], old_docs[pos+1:])
	doc_clients[doc_id] = new_docs
}

func add_client_tab_to_doc(doc_id string, client_tab *ClientTab) {
	docs, ok := doc_clients[doc_id]
	if !ok {
		// there was no clients slice
		docs := make([]ClientTab, 1, 2)
		docs[0] = *client_tab
		doc_clients[doc_id] = docs
	} else {
		// append to clients
		l := len(docs)
		if l+1 > cap(docs) {
			new_docs := make([]ClientTab, 2*l)
			copy(new_docs, docs)
			docs = new_docs[:l]
		}
		docs = docs[:l+1]
		docs[l] = *client_tab
		doc_clients[doc_id] = docs
	}

}

func ControlClients(stop_client_control chan bool) {
	for {
		select {
		case message := <-ClientControlMessages:
			previous_doc, ok := client_doc[message.ClientTab]
			if ok {
				// the client tab no longer uses the previous document
				remove_client_tab_from_doc(previous_doc, &message.ClientTab)
				fmt.Println("Client tab", message.ClientTab, "closed doc", message.DocumentId)
			}
			client_doc[message.ClientTab] = message.DocumentId
			add_client_tab_to_doc(message.DocumentId, &message.ClientTab)
			fmt.Println("Client tab", message.ClientTab, "opened doc", message.DocumentId)
		case <-stop_client_control:
			fmt.Println("Stop activity")
			return
		}
	}
}
