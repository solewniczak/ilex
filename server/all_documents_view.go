package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
	"sort"
)

type DocumentWithName struct {
	ilex.Document
	Name string `json:"name"`
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

func AllDocumentsView() {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		return
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	docs := database.C(ilex.DOCS)

	var found []ilex.Document
	err = docs.Find(nil).All(&found)
	if err != nil {
		fmt.Println("Could not start DocumentsView:", err.Error())
		return
	}

	var version ilex.Version
	texts := make(map[string]DocumentWithName)

	// Get the latest version's name as the document name.
	for _, doc := range found {
		err = GetLatestVersion(database, &doc, &version)
		if err != nil {
			fmt.Println("Could not start DocumentsView:", err.Error())
			return
		}
		texts[doc.Id.Hex()] = DocumentWithName{doc, version.Name}
	}

	fmt.Println("DocumnetsView is ready with document map: ", texts)

	for {
		select {
		case message := <-Globals.DocumentUpdatedMessages:
			text, ok := texts[message.DocumentId]
			if !ok {
				fmt.Println("DocumnetsView received notification about an unknown document: " + message.DocumentId)
				break
			}
			if text.Document.TotalVersions > message.Version || text.Document.TotalVersions+1 < message.Version {
				fmt.Println("Document", message.DocumentId, "'s versions are out of sync!")
				break
			} else if text.Document.TotalVersions+1 == message.Version {
				text.Document.TotalVersions++
				fmt.Println("Document", message.DocumentId, "total versions updated to", message.Version)
			}
			if text.Name != message.Name {
				text.Name = message.Name
				fmt.Println("Document", message.DocumentId, "name updated to", message.Name)
			}
			texts[message.DocumentId] = text

		case message := <-Globals.AllDocumentRequests:
			response := NewIlexMessage()
			response.Id = message.RequestId
			response.Action = ALL_TEXTS_INFO_RESPONSE
			var textsInfo ById
			for _, text := range texts {
				textsInfo = append(textsInfo, text)
			}
			sort.Sort(textsInfo)
			response.Parameters[TEXTS] = textsInfo
			respond(message.WS, response)

		case <-Globals.StopDocumentsView:
			fmt.Println("Stopping documents view")
			return
		}
	}
}
