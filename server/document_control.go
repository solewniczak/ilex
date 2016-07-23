package main

import (
	"fmt"
	"ilex/tree.v1"
	//	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
	"time"
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
	fmt.Println("Document controller for ", document_id, " is starting up.")

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Document controller could not start, because of database error " + err.Error())
		clean_up_after_controller(document_id)
		return
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	docs := database.C(ilex.DOCS)

	var document ilex.Document
	err = docs.Find(bson.M{"_id": bson.ObjectIdHex(document_id)}).One(&document)
	if err != nil {
		fmt.Println("Document controller could not start, because of database error " + err.Error())
		clean_up_after_controller(document_id)
		return
	}

	var version ilex.Version
	err = ilex.GetLatestVersion(database, &document, &version)
	if err != nil {
		fmt.Println("Document controller could not start, because of database error " + err.Error())
		clean_up_after_controller(document_id)
		return
	}

	clients := make(map[ClientTab]bool)
	editors := make(map[ClientTab]bool)
	editor_just_left := false
	edition_from_new_editor := false
	total_clients := 0

	root := tree.ConstructVersionTree(&version)
	if root == nil {
		fmt.Println("tree is nil")
	}
	root.Print(0)

	change_counter := 0

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
				i := 0
				for _, char := range message.String {
					root.AddRune(char, message.Position+i+1)
				}
				root.Print(0)
				fmt.Println(tree.GetTreeDump(root))
				change_counter++
				//if change_counter == 10 {
				//	change_counter = 0
				//	version.Id = bson.NewObjectId()
				//	version.No++
				//	if err = tree.PersistTree(root, &version); err != nil {
				//		fmt.Println("Could not save changes: " + err.Error() + ". Database may be corrupted!")
				//	}
				//	if err = ilex.UpdateDocument(docs, &document, &version); err != nil {
				//		fmt.Println("Could not update document: " + err.Error())
				//	}
				//	root.Print(0)
				//	fmt.Println(tree.GetTreeDump(root))
				//	version.Created = time.Now().Format(time.RFC3339)
				//}
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

	clean_up_after_controller(document_id)
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

func clean_up_after_controller(document_id string) {
	fmt.Println("Document controller for ", document_id, " is shutting down.")
	close(doc_add_text_messages[document_id])
	close(doc_remove_text_messages[document_id])
	close(doc_tab_control_messages[document_id])
	controllers[document_id] = false
}
