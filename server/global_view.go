package main

import (
	"fmt"
	"github.com/fatih/structs"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
	"sort"
)

const (
	NEW_DOCUMENT_AVAILABLE = "newDocumentAvailable"
	NEW_VERSION_AVAILABLE  = "newVersionAvailable"
)

type Text struct {
	Document string
	Version  int
}

type DocumentWithName struct {
	ilex.Document
	Name string `json:"name"`
}

func (dwn *DocumentWithName) toMap() map[string]interface{} {
	resp := make(map[string]interface{})
	upper := structs.Map(dwn.Document)
	for _, name := range structs.Names(dwn.Document) {
		resp[LowerFirst(name)] = upper[name]
	}
	resp[NAME] = dwn.Name
	return resp
}

type ById []DocumentWithName

func (a ById) Len() int           { return len(a) }
func (a ById) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ById) Less(i, j int) bool { return a[i].Document.Id < a[j].Document.Id }

type AllDocumentsRequest struct {
	WS        *websocket.Conn
	RequestId int
}

type DocumentUpdate struct {
	DocumentId string
	Version    int
	Name       string
}

type NewDocumentRequest struct {
	Client    ClientTab
	Name      string
	Class     string
	Format    string
	Text      string
	RequestId int
}

func NotifyClientsNewVersion(message *DocumentUpdate) {
	for client, is_present := range Globals.Clients {
		if is_present {
			n := NewNotification()
			n.Notification = NEW_VERSION_AVAILABLE
			n.Parameters[DOCUMENT] = message.DocumentId
			n.Parameters[VERSION] = message.Version
			n.SendTo(client)
		}
	}
}

func NotifyClientsNewDocument(newDoc *DocumentWithName) {
	for client, is_present := range Globals.Clients {
		if is_present {
			n := NewNotification()
			n.Notification = NEW_DOCUMENT_AVAILABLE
			n.Parameters = newDoc.toMap()
			n.SendTo(client)
		}
	}
}

type GlobalView struct {
	texts    map[string]DocumentWithName
	stopView chan interface{}
}

func (gv *GlobalView) isLatest(text *Text) bool {
	docWithName, ok := gv.texts[text.Document]
	if ok {
		return docWithName.Document.TotalVersions == text.Version
	}
	fmt.Println("GlobalView received a question about an unknown document!")
	return false
}

func (gv *GlobalView) clearAllDataForSocket(ws *websocket.Conn) {
	for client_tab, text := range Globals.ClientDoc {
		if client_tab.WS == ws {
			if gv.isLatest(&text) {
				Globals.DocTabControlMessages[text.Document] <- ClientTabClosed(client_tab)
			}
			delete(Globals.ClientDoc, client_tab)
		}
	}
}

func (gv *GlobalView) updateClientDocs(updated *Text) {
	for client_tab, text := range Globals.ClientDoc {
		if text == *updated {
			text.Version++
			Globals.ClientDoc[client_tab] = text
		}
	}
}

func (gv *GlobalView) registerOpening(message *ClientTabMessage) {
	text := Text{message.DocumentId, message.Version}
	previous_text, ok := Globals.ClientDoc[message.ClientTab]
	if ok && text == previous_text {
		return
	}

	if gv.isLatest(&text) {
		if !Globals.Controllers[message.DocumentId] {
			start_document_controller(message.DocumentId)
		}
		Globals.DocTabControlMessages[message.DocumentId] <- message
	}

	if ok && gv.isLatest(&previous_text) {
		// the client tab no longer uses the previous document
		Globals.DocTabControlMessages[previous_text.Document] <- ClientTabClosed(message.ClientTab)
	}

	Globals.ClientDoc[message.ClientTab] = text

}

func NewGlobalView() *GlobalView {
	gv := GlobalView{make(map[string]DocumentWithName), make(chan interface{})}
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		return nil
	}

	database := db_session.DB(ilex.DEFAULT_DB)
	docs := database.C(ilex.DOCS)

	var found []ilex.Document
	err = docs.Find(nil).All(&found)
	if err != nil {
		fmt.Println("Could not start GlobalView. Getting docs error:", err.Error())
		return nil
	}

	var version ilex.Version

	// Get the latest version's name as the document name.
	for _, doc := range found {
		err = GetLatestVersion(database, &doc, &version)
		if err != nil {
			fmt.Println("Could not start GlobalView because of database inconsistency. Error getting versions for", doc.Id.Hex(), ":", err.Error())
			return nil
		}
		gv.texts[doc.Id.Hex()] = DocumentWithName{doc, version.Name}
	}

	fmt.Println("GlobalView is ready with document map: ", gv.texts)

	go func() {
		defer db_session.Close()
		for {
			select {
			case message := <-Globals.DocumentUpdatedMessages:
				text, ok := gv.texts[message.DocumentId]
				if !ok {
					fmt.Println("GlobalView received notification about an unknown document: " + message.DocumentId)
					break
				}
				if text.Document.TotalVersions > message.Version || text.Document.TotalVersions+1 < message.Version {
					fmt.Println("Document", message.DocumentId, "'s versions are out of sync!")
					break
				} else if text.Document.TotalVersions+1 == message.Version {
					gv.updateClientDocs(&Text{text.Document.Id.Hex(), text.Document.TotalVersions})
					text.Document.TotalVersions++
					fmt.Println("Document", message.DocumentId, "total versions updated to", message.Version)
					NotifyClientsNewVersion(message)
				}
				if text.Name != message.Name {
					text.Name = message.Name
					fmt.Println("Document", message.DocumentId, "name updated to", message.Name)
				}
				gv.texts[message.DocumentId] = text

			case message := <-Globals.AllDocumentRequests:
				response := NewIlexMessage()
				response.Id = message.RequestId
				response.Action = ALL_TEXTS_INFO_RESPONSE
				var textsInfo ById
				for _, text := range gv.texts {
					textsInfo = append(textsInfo, text)
				}
				sort.Sort(textsInfo)
				response.Parameters[TEXTS] = textsInfo
				respond(message.WS, response)

			case message := <-Globals.NewDocumentRequests:
				err, doc := CreateNewDocument(docs, message)
				if err != nil {
					break
				}
				err = CreateFirstVersion(database, doc, message)
				if err != nil {
					break
				}
				docId := doc.Id.Hex()
				createdDoc := DocumentWithName{*doc, message.Name}
				gv.texts[docId] = createdDoc
				fmt.Println("Created document", docId, "with name", message.Name, "and and its first version")
				if message.Client.WS != nil {
					gv.registerOpening(ClientTabOpenedDoc(message.Client.WS, message.Client.TabId, docId, 1))
				}
				response := NewIlexMessage()
				response.Id = message.RequestId
				response.Action = DOCUMENT_CREATED
				response.Parameters = createdDoc.toMap()
				respond(message.Client.WS, response)

				NotifyClientsNewDocument(&createdDoc)

			case message := <-Globals.TabControlMessages:
				fmt.Println("Received message about document", message.DocumentId, ".")
				if message.Opened {
					gv.registerOpening(message)
				} else if message.Closed {
					currentText, ok := Globals.ClientDoc[message.ClientTab]
					if !ok {
						fmt.Println("Received an unexpected tab closing message. ")
						break
					}
					if gv.isLatest(&currentText) {
						Globals.DocTabControlMessages[currentText.Document] <- ClientTabClosed(message.ClientTab)
					}
					delete(Globals.ClientDoc, message.ClientTab)
				}

			case message := <-Globals.IsLatestRequests:
				Globals.IsLatestResponses <- gv.isLatest(message)

			case message := <-Globals.SocketControlMessages:
				gv.clearAllDataForSocket(message)

			case <-gv.stopView:
				fmt.Println("Stopping documents view")
				return
			}
		}
	}()
	return &gv
}

func (gv *GlobalView) Stop() {
	gv.stopView <- true
}
