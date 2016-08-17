package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
	"ilex/tree.v1"
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
	WS        *websocket.Conn
	RequestId int
}

func control_document(documentId string, subscriptions *ControllerSubscriptions) {
	fmt.Println("Document controller for ", documentId, " is starting up.")

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Document controller could not start, because of database error " + err.Error())
		CleanUpAfterController(documentId, subscriptions)
		return
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)

	controllerData := NewControllerData(documentId)
	err = controllerData.GetDocumentData(database)
	if err != nil {
		fmt.Println("Document controller could not start, because of database error " + err.Error())
		CleanUpAfterController(documentId, subscriptions)
		return
	}

	root := tree.ConstructVersionTree(&controllerData.Version)
	if root == nil {
		fmt.Println("tree is nil")
		CleanUpAfterController(documentId, subscriptions)
		return
	}
	//root.Print(0)

loop:
	for {
		select {
		case message := <-subscriptions.AddTextMessages:
			fmt.Println("text added", *message)
			controllerData.CheckForNewEditor(&message.Client)
			controllerData.TryUpdateVersion(database, root)

			i := 0
			for _, char := range message.String {
				root.AddRune(char, message.Position+i+1)
				i++
			}
			root.Print(0)
			fmt.Println(tree.GetTreeDump(root))

		case message := <-subscriptions.RemoveTextMessages:
			fmt.Println("text removed", *message)

		case message := <-subscriptions.TabControlMessages:
			fmt.Println("A client control message was received.")
			if message.Opened {
				controllerData.RegisterNewClientTab(&message.ClientTab)
			} else if message.Closed {
				controllerData.DeregisterClientTab(&message.ClientTab)
				if controllerData.TotalClients == 0 {
					break loop
				}
			}

		case message := <-subscriptions.DocDumpMessages:
			if message.Version != controllerData.Version.No {
				fmt.Println("Received request for version which is not current!")
			}
			response := NewIlexMessage()
			response.Id = message.RequestId
			response.Action = DOCUMENT_RETRIEVED
			if response.Parameters[TEXT], err = tree.GetTreeDump(root); err != nil {
				fmt.Println(err.Error())
				break
			}

			err, doc_links := GetLinksForDoc(database, documentId, controllerData.Version.No)
			if err != nil {
				fmt.Println(err.Error())
				break
			}
			response.Parameters[TAB] = message.Client.TabId
			response.Parameters[LINKS] = doc_links
			response.Parameters[IS_EDITABLE] = true
			response.Parameters[NAME] = controllerData.Version.Name
			response.Parameters[ID] = documentId
			respond(message.Client.WS, response)

		case message := <-subscriptions.GetVersionsMessages:
			response := NewIlexMessage()
			response.Id = message.RequestId
			response.Action = DOCUMENT_VERSIONS_INFO_RETRIEVED

			err, versions := GetAllVersions(database, &controllerData.Document)
			if err != nil {
				fmt.Println("Could not find versions" + err.Error())
				break
			}
			if len(versions) != controllerData.Version.No {
				versions = append(versions, controllerData.Version)
			}
			response.Parameters[VERSIONS] = versions
			respond(message.WS, response)
		}
	}

	CleanUpAfterController(documentId, subscriptions)
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

func CleanUpAfterController(documentId string, subscriptions *ControllerSubscriptions) {
	fmt.Println("Document controller for ", documentId, " is shutting down.")
	subscriptions.Close()
	Globals.Controllers[documentId] = false
}
