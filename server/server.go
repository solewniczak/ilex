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

func DisconnectClient(ws *websocket.Conn) {
	Globals.Clients[ws] = false
	fmt.Println("A client has been disconnected!")
	Globals.SocketControlMessages <- ws
}

func ActionServer(ws *websocket.Conn) {
	if found := Globals.Clients[ws]; !found {
		Globals.Clients[ws] = true
		fmt.Println("A new client has connected!")
	}

	for {
		var request IlexMessage
		err := websocket.JSON.Receive(ws, &request)

		if err != nil {
			log.Print(err)
			DisconnectClient(ws)
			break
		} else {
			js, _ := json.Marshal(request)
			fmt.Println("received request: ", string(js))

			if handler := Globals.Handlers[request.Action]; handler != nil {
				err = handler(&request, ws)
			} else {
				respond_with_nak(ws, NewIlexResponse(&request), "Unable to execute action "+request.Action)
			}

			if err != nil {
				log.Print(err)
				DisconnectClient(ws)
				break
			}
		}
	}
}

func main() {
	go handle_signals()

	wg := &sync.WaitGroup{}

	gv := NewGlobalView()
	if gv == nil {
		return
	}

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
		CloseAllControllers()
		file_listener.Close()
		ws_listener.Close()
		gv.Stop()
		Globals.ContollerGroup.Wait()
	}()

	wg.Wait()
}
