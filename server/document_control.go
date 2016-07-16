package main

import (
	"fmt"
	//	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
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

func construct_tree_from_address_table(addresses AddressTable, total_length int) Node {
	if len(addresses) == 0 {
		return nil
	}
	if len(addresses) == 1 {
		return &PNode{Length: total_length, Address: addresses[0][1]}
	}

	var i, sum int
	for ; i < len(addresses); i++ {
		sum += addresses[i][0]
		if sum >= total_length {
			break
		}
	}
	left := construct_tree_from_address_table(addresses[:i], sum)
	right := construct_tree_from_address_table(addresses[i:], total_length-sum)
	root := &Branch{Length: total_length, LengthLeft: sum, Left: left, Right: right}
	left.SetParent(root)
	right.SetParent(root)
	return root
}

func construct_version_tree(document_id string, version_no int) (root Node) {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("database access error: " + err.Error())
		return nil
	}
	defer db_session.Close()

	database := db_session.DB("default")
	versions := database.C("versions")

	var version Version
	err = versions.Find(bson.M{"DocumentId": document_id,
		"No": version_no}).One(&version)
	if err != nil {
		fmt.Println("retrieving version error: " + err.Error())
		return nil
	}

	return construct_tree_from_address_table(version.Addresses, version.Size)
}

func control_document(document_id string, add_text_messages chan *AddTextMessage, remove_text_messages chan *RemoveTextMessage, tab_control_messages chan *ClientTabMessage) {
	fmt.Println("Document controller for ", document_id, " is starting up.")
	clients := make(map[ClientTab]bool)
	editors := make(map[ClientTab]bool)
	editor_just_left := false
	edition_from_new_editor := false
	total_clients := 0

loop:
	for {
		select {
		case message := <-add_text_messages:
			{
				fmt.Println("text added", *message)
				if !editors[message.Client] {
					fmt.Println(message.Client, "started editing", document_id)
					editors[message.Client] = true
					edition_from_new_editor = true
				}
				if editor_just_left || edition_from_new_editor {
					// save work in progress and start a new version
					editor_just_left = false
					edition_from_new_editor = false
				}
			}

		case message := <-remove_text_messages:
			{
				fmt.Println("text removed", *message)
				if !editors[message.Client] {
					fmt.Println(message.Client, "started editing", document_id)
					editors[message.Client] = true
					edition_from_new_editor = true
				}
				if editor_just_left || edition_from_new_editor {
					// save work in progress and start a new version
					editor_just_left = false
					edition_from_new_editor = false
				}
			}

		case message := <-tab_control_messages:
			{
				fmt.Println("A client control message was received.")
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
						if editors[message.ClientTab] {
							fmt.Println(message.ClientTab, "started editing", document_id)
							editors[message.ClientTab] = false
							editor_just_left = true
						}
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
