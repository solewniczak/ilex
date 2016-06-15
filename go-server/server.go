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

const REQUEST_TEXT_DUMP = "requestTextDump"
const TEXT_RETRIEVED = "textRetrieved"
const TARGET = "target"
const TEXT = "text"
const LINKS = "links"

// the backticks are hints for the golang JSON marshaller -
// - names of the struct's json fields
type IlexMessage struct {
	Action     string                 `json:"action"`
	Parameters map[string]interface{} `json:"parameters"`
}

func (im *IlexMessage) Init() {
	im.Parameters = make(map[string]interface{})
}

type SimpleLink [][2]string

func requestTextDump(request *IlexMessage, ws *websocket.Conn) error {
	requested_text := request.Parameters[TEXT].(string)

	// Temporary solution: get running directory
	directory, err := filepath.Abs(filepath.Dir(os.Args[0]))
	path := directory + "/texts/" + requested_text + ".txt"
	buffer, err := ioutil.ReadFile(path)
	if err != nil {
		log.Print(err)
		return err
	}

	// hard coded test links
	links := SimpleLink{
		{"1+10", "100+200"},
		{"1+10", "500+100"},
		{"200+20", "310+10"},
		{"400+10 500+10", "1000+10"},
		{"401+5", "312+5"},
	}

	var response IlexMessage
	response.Init()
	response.Action = TEXT_RETRIEVED
	response.Parameters[TEXT] = string(buffer)
	response.Parameters[TARGET] = request.Parameters[TARGET]
	response.Parameters[LINKS] = links

	js, _ := json.Marshal(response)
	fmt.Println("sending response: ", string(js))
	return websocket.JSON.Send(ws, response)
}

func ActionServer(ws *websocket.Conn) {
	for {
		var request IlexMessage
		err := websocket.JSON.Receive(ws, &request)
		js, _ := json.Marshal(request)
		fmt.Println("received request: ", string(js))

		if err != nil {
			log.Print(err)
			break
		} else {
			switch request.Action {
			case REQUEST_TEXT_DUMP:
				err = requestTextDump(&request, ws)
			default:
				fmt.Println("Unable to execute action ", request.Action)
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
