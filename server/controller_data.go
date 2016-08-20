package main

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
	"ilex/tree.v1"
)

type ControllerData struct {
	Document               ilex.Document
	DocumentId             string
	Version                ilex.Version
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
	return GetLatestVersion(database, &cd.Document, &cd.Version)
}

func (cd *ControllerData) RegisterNewClientTab(clientTab *ClientTab) {
	if cd.Clients[*clientTab] {
		fmt.Println("Received an unexpected document opened message. Document did not have the tab registered as a client.")
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
			fmt.Println(*clientTab, "started editing", cd.DocumentId)
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
			if err := tree.PersistTree(root, &cd.Version); err != nil {
				fmt.Println("Could not save changes: " + err.Error() + ". Database may be corrupted!")
			}
			cd.HasUnsavedChanges = false
			if err := UpdateDocument(docs, &cd.Document, &cd.Version); err != nil {
				fmt.Println("Could not update document: " + err.Error())
			}
			cd.Version.Id = bson.NewObjectId()
			cd.Version.No++
			cd.Version.Created = ilex.CurrentTime()
			Globals.DocumentUpdatedMessages <- &DocumentUpdate{cd.DocumentId, cd.Version.No, cd.Version.Name}
		}
	}
}

func (cd *ControllerData) TryFinalUpdate(database *mgo.Database, root *tree.Root) {
	docs := database.C(ilex.DOCS)
	if cd.HasUnsavedChanges {
		cd.Version.Finished = ilex.CurrentTime()
		// save current work in progress
		if err := tree.PersistTree(root, &cd.Version); err != nil {
			fmt.Println("Could not save changes: " + err.Error() + ". Database may be corrupted!")
		}
		if err := UpdateDocument(docs, &cd.Document, &cd.Version); err != nil {
			fmt.Println("Could not update document: " + err.Error())
		}
	}
}
