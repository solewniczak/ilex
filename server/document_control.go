package main

import (
	"fmt"
	"ilex/tree.v1"
	//	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
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

type GetDumpMessage struct {
	Client    ClientTab
	Version   int
	RequestId int
}

type GetVersionsMessage struct {
	Client    ClientTab
	RequestId int
}

func control_document(documentId string, subscriptions *ControllerSubscriptions) {
	fmt.Println("Document controller for ", documentId, " is starting up.")

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Document controller could not start, because of database error " + err.Error())
		clean_up_after_controller(documentId, subscriptions)
		return
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	docs := database.C(ilex.DOCS)

	var document ilex.Document
	err = docs.Find(bson.M{"_id": bson.ObjectIdHex(documentId)}).One(&document)
	if err != nil {
		fmt.Println("Document controller could not start, because of database error " + err.Error())
		clean_up_after_controller(documentId, subscriptions)
		return
	}

	var version ilex.Version
	err = ilex.GetLatestVersion(database, &document, &version)
	if err != nil {
		fmt.Println("Document controller could not start, because of database error " + err.Error())
		clean_up_after_controller(documentId, subscriptions)
		return
	}

	clients := make(map[ClientTab]bool)
	editors := make(map[ClientTab]bool)
	editor_just_left := false
	edition_from_new_editor := false
	is_first_edition := true
	total_clients := 0

	root := tree.ConstructVersionTree(&version)
	if root == nil {
		fmt.Println("tree is nil")
		clean_up_after_controller(documentId, subscriptions)
		return
	}
	root.Print(0)

loop:
	for {
		select {
		case message := <-subscriptions.AddTextMessages:
			fmt.Println("text added", *message)
			if !editors[message.Client] {
				fmt.Println(message.Client, "started editing", documentId)
				editors[message.Client] = true
				edition_from_new_editor = true
			}
			if editor_just_left || edition_from_new_editor {
				// save work in progress and start a new version
				editor_just_left = false
				edition_from_new_editor = false

				if is_first_edition {
					// begin modifying last saved version - nothing to save
					is_first_edition = false
					version.Id = bson.NewObjectId()
					version.No++
					version.Created = ilex.CurrentTime()
					fmt.Println("New version number created for "+documentId+": ", version.No)
					if err = ilex.UpdateDocument(docs, &document, &version); err != nil {
						fmt.Println("Could not update document: " + err.Error())
					}
					Globals.DocumentUpdatedMessages <- &DocumentUpdate{documentId, version.No, version.Name}
				} else {
					version.Finished = ilex.CurrentTime()
					// save current work in progress and start a new version
					if err = tree.PersistTree(root, &version); err != nil {
						fmt.Println("Could not save changes: " + err.Error() + ". Database may be corrupted!")
					}
					if err = ilex.UpdateDocument(docs, &document, &version); err != nil {
						fmt.Println("Could not update document: " + err.Error())
					}
					version.Id = bson.NewObjectId()
					version.No++
					version.Created = ilex.CurrentTime()
					Globals.DocumentUpdatedMessages <- &DocumentUpdate{documentId, version.No, version.Name}
				}
				root.Print(0)
				fmt.Println(tree.GetTreeDump(root))

			}
			i := 0
			for _, char := range message.String {
				root.AddRune(char, message.Position+i+1)
			}
			root.Print(0)
			fmt.Println(tree.GetTreeDump(root))

		case message := <-subscriptions.RemoveTextMessages:
			fmt.Println("text removed", *message)
			if !editors[message.Client] {
				fmt.Println(message.Client, "started editing", documentId)
				editors[message.Client] = true
				edition_from_new_editor = true
			}
			if editor_just_left || edition_from_new_editor {
				// save work in progress and start a new version
				editor_just_left = false
				edition_from_new_editor = false
			}

		case message := <-subscriptions.TabControlMessages:
			fmt.Println("A client control message was received.")
			if message.Opened {
				if clients[message.ClientTab] {
					fmt.Println("Received an unexpected document opened message. Document did not have the tab registered as a client.")
				} else {
					clients[message.ClientTab] = true
					total_clients++
					fmt.Println("Client tab", message.ClientTab, "opened doc", documentId)
				}
			} else if message.Closed {
				if !clients[message.ClientTab] {
					fmt.Println("Received an unexpected document closing message. Document did not have the tab registered as a client.")
				} else {
					clients[message.ClientTab] = false
					if editors[message.ClientTab] {
						fmt.Println(message.ClientTab, "started editing", documentId)
						editors[message.ClientTab] = false
						editor_just_left = true
					}
					fmt.Println("Client tab", message.ClientTab, "closed doc", documentId)
					total_clients--
					if total_clients == 0 {
						break loop
					}
				}
			}

		case message := <-subscriptions.DocDumpMessages:
			if message.Version != version.No {
				fmt.Println("Received request for version which is not current!")
			}
			response := NewIlexMessage()
			response.Id = message.RequestId
			response.Action = DOCUMENT_RETRIEVED
			if response.Parameters[TEXT], err = tree.GetTreeDump(root); err != nil {
				fmt.Println(err.Error())
				break
			}
			response.Parameters[TAB] = message.Client.TabId
			response.Parameters[LINKS] = SimpleLink{{"1+10", "100+200"}}
			response.Parameters[IS_EDITABLE] = true
			response.Parameters[NAME] = version.Name
			response.Parameters[ID] = documentId
			respond(message.Client.WS, response)

		case message := <-subscriptions.GetVersionsMessages:
			response := NewIlexMessage()
			response.Id = message.RequestId
			response.Action = DOCUMENT_VERSIONS_INFO_RETRIEVED

			err, versions := ilex.GetAllVersions(database, &document)
			if err != nil {
				fmt.Println("Could not find versions" + err.Error())
				break
			}
			if len(versions) != version.No {
				versions = append(versions, version)
			}
			response.Parameters[VERSIONS] = versions
			respond(message.Client.WS, response)
		}
	}

	clean_up_after_controller(documentId, subscriptions)
}

func start_document_controller(documentId string) {
	if Globals.Controllers[documentId] {
		fmt.Println("Document controller for ", documentId, " already exists")
		return
	}
	subscriptions := NewControllerSubscriptions()

	go control_document(documentId, subscriptions)

	subscriptions.Subscribe(documentId)
	Globals.Controllers[documentId] = true
}

func clean_up_after_controller(documentId string, subscriptions *ControllerSubscriptions) {
	fmt.Println("Document controller for ", documentId, " is shutting down.")
	subscriptions.Close()
	Globals.Controllers[documentId] = false
}
