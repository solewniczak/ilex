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

func respond_with_nak(ws *websocket.Conn, response *IlexMessage, error_description string) error {
	response.Action = NAK
	response.Parameters[ERROR] = error_description
	js, _ := json.Marshal(response)
	fmt.Println("sending response: ", string(js))
	return websocket.JSON.Send(ws, response)
}

func respond(ws *websocket.Conn, response *IlexMessage) error {
	js, _ := json.Marshal(response)
	fmt.Println("sending response: ", string(js))
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
			js, _ := json.Marshal(request)
			fmt.Println("received request: ", string(js))

			switch request.Action {
			case DOCUMENT_ADD_TEXT:
				err = documentAddText(&request, ws)
			case DOCUMENT_REMOVE_TEXT:
				err = documentRemoveText(&request, ws)
			case DOCUMENT_GET_DUMP:
				err = documentGetDump(&request, ws)
			case GET_ALL_DOCUMENTS_INFO:
				err = getAllDocumentsInfo(&request, ws)
			case TAB_CLOSE:
				err = tabClose(&request, ws)
			default:
				response := NewIlexResponse(&request)
				respond_with_nak(ws, response, "Unable to execute action "+request.Action)
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
		AllDocumentsView()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		ControlClients()
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
		<-Globals.StopServer
		file_listener.Close()
		ws_listener.Close()
		Globals.StopClientControl <- true
		Globals.StopDocumentsView <- true
	}()

	wg.Wait()
}
