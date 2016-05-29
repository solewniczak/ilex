package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
)

const REQUEST_TEXT = "requestText"
const TEXT_RETRIEVED = "textRetrieved"
const TARGET = "target"
const TEXT = "text"

const CREATE_LINK = "createLink"

const MODIFY_DOCUMENT = "modifyDocument"

// the backticks are hints for JSON marshaller - names of json fields
type IlexMessage struct {
	Action     string                 `json:"action"`
	Parameters map[string]interface{} `json:"parameters"`
}

func (im *IlexMessage) Init() {
	im.Parameters = make(map[string]interface{})
}

func requestText(request *IlexMessage, ws *websocket.Conn) error {
	requested_text := request.Parameters[TEXT].(string)

	// Temporary solution: get running directory
	directory, err := filepath.Abs(filepath.Dir(os.Args[0]))
	path := directory + "/texts/" + requested_text + ".txt"
	buffer, err := ioutil.ReadFile(path)
	if err != nil {
		log.Print(err)
		return err
	}

	var response IlexMessage
	response.Init()
	response.Action = TEXT_RETRIEVED
	response.Parameters[TEXT] = string(buffer)
	response.Parameters[TARGET] = request.Parameters[TARGET]

	return websocket.JSON.Send(ws, response)
}

func ActionServer(ws *websocket.Conn) {
	for {
		var request IlexMessage
		err := websocket.JSON.Receive(ws, &request)

		if err != nil {
			log.Print(err)
			break
		} else {
			switch request.Action {
			case REQUEST_TEXT:
				err = requestText(&request, ws)
			case CREATE_LINK:
				js, _ := json.Marshal(request)
				fmt.Println("received link button click: ", string(js))
			case MODIFY_DOCUMENT:
				js, _ := json.MarshalIndent(request, "", "  ")
				fmt.Println("received document modification: ", string(js))
			}
			if err != nil {
				log.Print(err)
				break
			}
		}
	}
}

func main() {
	wg := &sync.WaitGroup{}
	wg.Add(1)
	go func() {
		server_path, _ := filepath.Abs(filepath.Dir(os.Args[0]))
		main_path := filepath.Dir(server_path)
		http.Handle("/", http.FileServer(http.Dir(main_path)))
		log.Fatal(http.ListenAndServe(":8000", nil))
		wg.Done()
	}()

	wg.Add(1)
	go func() {
		http.Handle("/echobot", websocket.Handler(ActionServer))
		log.Fatal(http.ListenAndServe(":9000", nil))
		wg.Done()
	}()
	wg.Wait()
}
