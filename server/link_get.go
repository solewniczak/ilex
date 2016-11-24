package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
)

const (
	LINK_GET_LEFT     = "linkGetLeft"
	LINK_GET_RIGHT    = "linkGetRight"
	LINK_GET_RESPONSE = "linkGetResponse"
	LINK_ID           = "linkId"
)

func linkGet(request *IlexMessage, ws *websocket.Conn, isLeft bool) error {
	response := NewIlexResponse(request)
	requestedLinkId, ok := request.Parameters[LINK_ID].(string)
	if !ok {
		respond_with_nak(ws, response, "No link id supplied!")
	}

	db_session, err := mgo.Dial(ilex.DEFAULT_HOST)
	if err != nil {
		fmt.Println("Did not find database!")
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "Link error: " + err.Error()
		return respond(ws, response)
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	links := database.C(ilex.LINKS)

	var link ilex.TwoWayLink
	err = links.Find(bson.M{"_id": bson.ObjectIdHex(requestedLinkId)}).One(&link)
	if err != nil {
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "Link error: " + err.Error()
		return respond(ws, response)
	}

	var halfLink ilex.HalfLink
	if isLeft {
		halfLink = link.GetLeft()
	} else {
		halfLink = link.GetRight()
	}

	text := Text{halfLink.Anchor.DocumentId.Hex(), halfLink.Anchor.VersionNo}

	Globals.IsLatestRequests <- &text
	isLatest := <-Globals.IsLatestResponses
	if isLatest && Globals.Controllers[text.Document] {
		// the link leads to a document, which is currently being edited
		Globals.DocGetHalfLinkMessages[text.Document] <- &GetHalfLinkMessage{requestedLinkId, ws, request.Id}
		return nil
	}

	response.Action = LINK_GET_RESPONSE
	response.Parameters = ToMap(halfLink)

	return respond(ws, response)
}

// partial function application
func linkGetF(isLeft bool) func(request *IlexMessage, ws *websocket.Conn) error {
	return func(request *IlexMessage, ws *websocket.Conn) error {
		return linkGet(request, ws, isLeft)
	}
}
