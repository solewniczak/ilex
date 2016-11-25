package main

import (
	"encoding/json"
	"golang.org/x/net/websocket"
	"ilex/ilex"
)

const (
	ADD_LINK     = "addLink"
	LINK_CREATED = "linkCreated"
	LEFT         = "left"
	RIGHT        = "right"
	RANGE        = "range"
	TYPE         = "type"
	DOCUMENT_ID  = "documentId"
	VERSION_NO   = "versionNo"
)

type JsonAnchor struct {
	DocumentId string     `json:"documentId"`
	VersionNo  int        `json:"versionNo"`
	Range      ilex.Range `json:"range"`
	Type       string     `json:"type"`
}

func linkAdd(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	//left_anchor, ok := request.Parameters[LEFT].(ilex.HalfLink)
	leftMap, ok := request.Parameters[LEFT].(map[string]interface{})
	if !ok {
		return respond_with_nak(ws, response, "No left anchor supplied!")
	}
	leftJson, _ := json.Marshal(leftMap)
	var leftAnchor ilex.Anchor
	err := json.Unmarshal(leftJson, &leftAnchor)

	if err != nil {
		return respond_with_nak(ws, response, "Incorrect left anchor")
	}

	//right_anchor, ok := request.Parameters[RIGHT].(ilex.HalfLink)
	_, ok = request.Parameters[RIGHT].(JsonAnchor)
	if !ok {
		return respond_with_nak(ws, response, "No right anchor supplied!")
	}

	return nil
}
