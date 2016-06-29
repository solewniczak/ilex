package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
)

const (
	REQUEST_ALL_TEXTS_INFO  = "requestAllTextsInfo"
	ALL_TEXTS_INFO_RESPONSE = "allTextsInfoResponse"
	TEXTS                   = "texts"
	GETTING_INFO_FAILED     = "gettingInfoFailed"
)

func requestAllTextsInfo(request *IlexMessage, ws *websocket.Conn) error {
	response := NewIlexResponse(request)

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		response.Action = GETTING_INFO_FAILED
		response.Parameters[ERROR] = err.Error()
		goto send
	}
	defer db_session.Close()

	{
		database := db_session.DB("default")
		docs := database.C("docs")

		var found []Document
		err = docs.Find(nil).All(&found)
		if err != nil {
			fmt.Println(err)
			response.Action = GETTING_INFO_FAILED
			response.Parameters[ERROR] = err.Error()
			goto send
		}

		response.Action = ALL_TEXTS_INFO_RESPONSE
		response.Parameters[TEXTS] = found
	}

send:
	js, _ := json.Marshal(response)
	fmt.Println("sending response: ", string(js))
	return websocket.JSON.Send(ws, response)
}
