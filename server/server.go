package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sync"
)

var StopServer chan bool = make(chan bool)

func ActionServer(ws *websocket.Conn) {
	for {
		var request IlexMessage
		err := websocket.JSON.Receive(ws, &request)

		if err != nil {
			js, _ := json.Marshal(request)
			fmt.Println("received request: ", string(js))
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
	var stop_client_control chan bool = make(chan bool)

	wg := &sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		ControlClients(stop_client_control)
	}()

	file_listener, err := net.Listen("tcp", ":8000")
	if err != nil {
		log.Fatal(err)
	}
	wg.Add(1)
	go func() {
		defer wg.Done()
		server_path, _ := filepath.Abs(filepath.Dir(os.Args[0]))
		main_path := filepath.Dir(server_path)
		server := http.Server{Handler: http.FileServer(http.Dir(main_path))}
		fmt.Println(server.Serve(file_listener))
	}()

	ws_listener, err := net.Listen("tcp", ":9000")
	if err != nil {
		log.Fatal(err)
	}
	wg.Add(1)
	go func() {
		defer wg.Done()
		server := http.Server{Handler: websocket.Handler(ActionServer)}
		fmt.Println(server.Serve(ws_listener))
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		<-StopServer
		file_listener.Close()
		ws_listener.Close()
		stop_client_control <- true
	}()

	wg.Wait()
}
