package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
)

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
			case REQUEST_ALL_TEXTS_INFO:
				err = requestAllTextsInfo(&request, ws)
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
		defer wg.Done()
		server_path, _ := filepath.Abs(filepath.Dir(os.Args[0]))
		main_path := filepath.Dir(server_path)
		http.Handle("/", http.FileServer(http.Dir(main_path)))
		log.Fatal(http.ListenAndServe(":8000", nil))
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		http.Handle("/echobot", websocket.Handler(ActionServer))
		log.Fatal(http.ListenAndServe(":9000", nil))
	}()
	wg.Wait()
}
