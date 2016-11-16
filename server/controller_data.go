package main

import (
	"errors"
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
	"ilex/lc.v1"
	"ilex/tree.v1"
)

const (
	VERSION_NUMBER_INCREMENTED = "versionNumberIncremented"
)

type ControllerData struct {
	Document               ilex.Document
	DocumentId             string
	Version                ilex.Version
	LinksContainter        lc.LinkContainer
	Clients                map[ClientTab]bool
	TotalClients           int
	Editors                map[ClientTab]bool
	IsFirstEdition         bool
	DidEditorJustLeave     bool
	IsEditionFromNewEditor bool
	HasUnsavedChanges      bool
}

func NewControllerData(documentId string) *ControllerData {
	var result ControllerData
	result.DocumentId = documentId
	result.Clients = make(map[ClientTab]bool)
	result.Editors = make(map[ClientTab]bool)
	result.IsFirstEdition = true
	// the rest of the fields are (by language definition) empty, zero or false
	return &result
}

func (cd *ControllerData) GetDocumentData(database *mgo.Database) error {
	docs := database.C(ilex.DOCS)
	if err := docs.Find(bson.M{"_id": bson.ObjectIdHex(cd.DocumentId)}).One(&cd.Document); err != nil {
		return err
	}
	if err := GetLatestVersion(database, &cd.Document, &cd.Version); err != nil {
		return err
	}
	if cd.LinksContainter = lc.NewLinkContainer(&cd.Document.Id, cd.Version.No, database); cd.LinksContainter == nil {
		return errors.New("Could not create links container")
	}
	return nil
}

func (cd *ControllerData) RegisterNewClientTab(clientTab *ClientTab) {
	if cd.Clients[*clientTab] {
		fmt.Println("Received an unexpected document opened message. Document already had the tab registered as a client.")
	} else {
		cd.Clients[*clientTab] = true
		cd.TotalClients++
		fmt.Println("Client tab", *clientTab, "opened doc", cd.Document)
	}
}

func (cd *ControllerData) DeregisterClientTab(clientTab *ClientTab) {
	if !cd.Clients[*clientTab] {
		fmt.Println("Received an unexpected document closing message. Document did not have the tab registered as a client.")
	} else {
		cd.Clients[*clientTab] = false
		if cd.Editors[*clientTab] {
			fmt.Println(*clientTab, "stopped editing", cd.DocumentId)
			cd.Editors[*clientTab] = false
			cd.DidEditorJustLeave = true
		}
		fmt.Println("Client tab", *clientTab, "closed doc", cd.DocumentId)
		cd.TotalClients--
	}
}

func (cd *ControllerData) CheckForNewEditor(clientTab *ClientTab) {
	if !cd.Editors[*clientTab] {
		fmt.Println(*clientTab, "started editing", cd.DocumentId)
		cd.Editors[*clientTab] = true
		cd.IsEditionFromNewEditor = true
	}
}

func (cd *ControllerData) TryUpdateVersion(database *mgo.Database, root *tree.Root) {
	if cd.DidEditorJustLeave || cd.IsEditionFromNewEditor {
		// save work in progress and start a new version
		cd.DidEditorJustLeave = false
		cd.IsEditionFromNewEditor = false

		docs := database.C(ilex.DOCS)
		if cd.IsFirstEdition {
			// begin modifying last saved version - nothing to save
			cd.IsFirstEdition = false
			cd.Version.Id = bson.NewObjectId()
			cd.Version.No++
			cd.Version.Created = ilex.CurrentTime()
			fmt.Println("New version number created for "+cd.DocumentId+": ", cd.Version.No)
			if err := UpdateDocument(docs, &cd.Document, &cd.Version); err != nil {
				fmt.Println("Could not update document: " + err.Error())
			}
			Globals.DocumentUpdatedMessages <- &DocumentUpdate{cd.DocumentId, cd.Version.No, cd.Version.Name}
		} else {
			cd.Version.Finished = ilex.CurrentTime()
			// save current work in progress and start a new version
			if err := cd.LinksContainter.Persist(database); err != nil {
				fmt.Println("Could not save links: " + err.Error() + ". Database may be corrupted!")
			}
			if err := tree.PersistTree(root, &cd.Version); err != nil {
				fmt.Println("Could not save editions: " + err.Error() + ". Database may be corrupted!")
			}
			cd.HasUnsavedChanges = false
			cd.Version.Id = bson.NewObjectId()
			cd.Version.No++
			cd.Version.Created = ilex.CurrentTime()
			if err := UpdateDocument(docs, &cd.Document, &cd.Version); err != nil {
				fmt.Println("Could not update document: " + err.Error())
			}
			Globals.DocumentUpdatedMessages <- &DocumentUpdate{cd.DocumentId, cd.Version.No, cd.Version.Name}
		}
		cd.NotifyClientsNewVersion()
	}
}

func (cd *ControllerData) TryFinalUpdate(database *mgo.Database, root *tree.Root) {
	docs := database.C(ilex.DOCS)
	if cd.HasUnsavedChanges {
		cd.Version.Finished = ilex.CurrentTime()
		// save current work in progress
		if err := cd.LinksContainter.Persist(database); err != nil {
			fmt.Println("Could not save links: " + err.Error() + ". Database may be corrupted!")
		}
		if err := tree.PersistTree(root, &cd.Version); err != nil {
			fmt.Println("Could not save editions: " + err.Error() + ". Database may be corrupted!")
		}
		if err := UpdateDocument(docs, &cd.Document, &cd.Version); err != nil {
			fmt.Println("Could not update document: " + err.Error())
		}
	}
}

func (cd *ControllerData) NotifyClientsAddText(message *AddTextMessage) {
	for client, is_present := range cd.Clients {
		if is_present && client != message.Client {
			n := NewTabNotification(client.TabId)
			n.Notification = DOCUMENT_ADD_TEXT
			n.Parameters[POSITION] = message.Position
			n.Parameters[STRING] = message.String
			n.Parameters[LENGTH] = message.Length
			n.Parameters[LINK_IDS] = message.LinkIds
			n.SendTo(client.WS)
		}
	}
}

func (cd *ControllerData) NotifyClientsRemoveText(message *RemoveTextMessage) {
	for client, is_present := range cd.Clients {
		if is_present && client != message.Client {
			n := NewTabNotification(client.TabId)
			n.Notification = DOCUMENT_REMOVE_TEXT
			n.Parameters[POSITION] = message.Position
			n.Parameters[LENGTH] = message.Length
			n.SendTo(client.WS)
		}
	}
}

func (cd *ControllerData) NotifyClientsNameChange(message *ChangeNameMessage) {
	for client, is_present := range cd.Clients {
		if is_present && client != message.Client {
			n := NewTabNotification(client.TabId)
			n.Notification = DOCUMENT_CHANGE_NAME
			n.Parameters[NAME] = message.NewName
			n.SendTo(client.WS)
		}
	}
}

func (cd *ControllerData) NotifyClientsNewVersion() {
	for client, is_present := range cd.Clients {
		if is_present {
			n := NewTabNotification(client.TabId)
			n.Notification = VERSION_NUMBER_INCREMENTED
			n.Parameters[VERSION] = cd.Version.No
			n.SendTo(client.WS)
		}
	}
}
