package main

import (
	"golang.org/x/net/websocket"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// the backticks are hints for JSON marshaller - names of json fields
type IlexMessage struct {
	Target string `json:"target"`
	Text   string `json:"text"`
}

func FileServer(ws *websocket.Conn) {
	for {
		var ilex_request IlexMessage
		err := websocket.JSON.Receive(ws, &ilex_request)

		if err != nil {
			log.Fatal(err)
		} else {
			var ilex_response IlexMessage
			ilex_response.Target = ilex_request.Target

			// Temporary solution: get running directory
			directory, err := filepath.Abs(filepath.Dir(os.Args[0]))
			path := directory + "/texts/" + ilex_request.Text + ".txt"
			buffer, err := ioutil.ReadFile(path)
			if err != nil {
				log.Fatal(err)
			}
			ilex_response.Text = string(buffer)

			err = websocket.JSON.Send(ws, ilex_response)
			if err != nil {
				log.Fatal(err)
			}
		}
	}
}

func main() {
	http.Handle("/echobot", websocket.Handler(FileServer))
	err := http.ListenAndServe(":9000", nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}
}
