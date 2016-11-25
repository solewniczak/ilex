package main

import (
	"errors"
	"fmt"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
)

const (
	ADD_LINK           = "addLink"
	ADDING_LINK_FAILED = "addingLinkFailed"
	LINK_CREATED       = "linkCreated"
	LEFT               = "left"
	RIGHT              = "right"
	RANGE              = "range"
	TYPE               = "type"
	DOCUMENT_ID        = "documentId"
	VERSION_NO         = "versionNo"
	LINEAGE            = "lineage"
)

type JsonAnchor struct {
	DocumentId string     `json:"documentId"`
	VersionNo  int        `json:"versionNo"`
	Range      ilex.Range `json:"range"`
	Type       string     `json:"type"`
}

func getAnchor(from map[string]interface{}) (ilex.Anchor, error) {
	documentId, ok := from[DOCUMENT_ID].(string)
	if !ok {
		return ilex.Anchor{}, errors.New("documentId string was not supplied.")
	}
	if !bson.IsObjectIdHex(documentId) {
		return ilex.Anchor{}, errors.New("documentId is not a valid ID.")
	}
	versionNo, ok := from[VERSION_NO].(float64)
	if !ok {
		return ilex.Anchor{}, errors.New("version number was not supplied.")
	}
	linkType, ok := from[TYPE].(string)
	if !ok {
		return ilex.Anchor{}, errors.New("halfLink type was not supplied.")
	}
	anchorRange, ok := from[RANGE].(map[string]interface{})
	if !ok {
		return ilex.Anchor{}, errors.New("range was not supplied.")
	}
	position, ok := anchorRange[POSITION].(float64)
	if !ok {
		return ilex.Anchor{}, errors.New("position was not supplied.")
	}
	length, ok := anchorRange[LENGTH].(float64)
	if !ok {
		return ilex.Anchor{}, errors.New("length was not supplied.")
	}

	return ilex.Anchor{bson.ObjectIdHex(documentId), int(versionNo), ilex.Range{int(position), int(length)}, linkType}, nil
}

func validateAnchor(anchor *ilex.Anchor, database *mgo.Database) error {
	var err error
	docs := database.C(ilex.DOCS)

	var document ilex.Document
	err = docs.Find(bson.M{"_id": anchor.DocumentId}).One(&document)
	if err != nil {
		return errors.New("Document not found: " + err.Error())
	}

	if anchor.VersionNo <= 0 || anchor.VersionNo > document.TotalVersions {
		return errors.New("Non-exisiting version provided.")
	}

	if !(anchor.Type == "H" || anchor.Type == "F") {
		return errors.New("Unknown link type provided.")
	}

	return nil
}

func validateLink(link *ilex.TwoWayLink) error {
	if link.Left.DocumentId == link.Right.DocumentId {
		return errors.New("Links within document are not supported")
	}
	return nil
}

func notifyController(link *ilex.TwoWayLink, anchor *ilex.Anchor, isLeft bool) {
	documentId := anchor.DocumentId.Hex()
	text := Text{documentId, anchor.VersionNo}
	Globals.IsLatestRequests <- &text
	isLatest := <-Globals.IsLatestResponses
	if isLatest && Globals.Controllers[documentId] {
		halfLink := ilex.HalfLink{*anchor, link.Id, link.Lineage, isLeft}
		Globals.DocNewHalfLinkMessages[documentId] <- &NewHalfLinkMessage{halfLink}
	}

}

func notifyControllers(link *ilex.TwoWayLink) {
	notifyController(link, &link.Left, true)
	notifyController(link, &link.Right, false)
}

func linkAdd(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	leftMap, ok := request.Parameters[LEFT].(map[string]interface{})
	if !ok {
		return respond_with_nak(ws, response, "No left anchor supplied!")
	}
	leftAnchor, err := getAnchor(leftMap)
	if err != nil {
		return respond_with_nak(ws, response, "Incorrect left anchor: "+err.Error())
	}

	rightMap, ok := request.Parameters[RIGHT].(map[string]interface{})
	if !ok {
		return respond_with_nak(ws, response, "No right anchor supplied!")
	}
	rightAnchor, err := getAnchor(rightMap)
	if err != nil {
		return respond_with_nak(ws, response, "Incorrect right anchor: "+err.Error())
	}

	db_session, err := mgo.Dial(ilex.DEFAULT_HOST)
	if err != nil {
		fmt.Println("Did not find database!")
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "Document error: " + err.Error()
		return respond(ws, response)
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)

	if err = validateAnchor(&leftAnchor, database); err != nil {
		return respond_with_nak(ws, response, "Invalid left anchor: "+err.Error())
	}
	if err = validateAnchor(&rightAnchor, database); err != nil {
		return respond_with_nak(ws, response, "Invalid right anchor: "+err.Error())
	}

	newLink := ilex.TwoWayLink{bson.NewObjectId(), bson.NewObjectId(), leftAnchor, rightAnchor}
	if err = validateLink(&newLink); err != nil {
		return respond_with_nak(ws, response, "Invalid link: "+err.Error())
	}

	links := database.C(ilex.LINKS)
	if err = links.Insert(&newLink); err != nil {
		response.Action = ADDING_LINK_FAILED
		response.Parameters[ERROR] = "Adding link failed with error: " + err.Error()
		return respond(ws, response)
	}
	notifyControllers(&newLink)

	response.Action = LINK_CREATED
	response.Parameters[LINK_ID] = newLink.Id
	response.Parameters[LINEAGE] = newLink.Lineage

	return respond(ws, response)
}
