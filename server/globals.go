package main

import (
	"golang.org/x/net/websocket"
	"sync"
)

var Globals = struct {
	StopServer               chan interface{}
	SocketControlMessages    chan *websocket.Conn
	TabControlMessages       chan *ClientTabMessage
	AllDocumentRequests      chan *AllDocumentsRequest
	DocumentUpdatedMessages  chan *DocumentUpdate
	NewDocumentRequests      chan *NewDocumentRequest
	DocAddTextMessages       map[string](chan *AddTextMessage)
	DocRemoveTextMessages    map[string](chan *RemoveTextMessage)
	DocChangeNameMessages    map[string](chan *ChangeNameMessage)
	DocTabControlMessages    map[string](chan *ClientTabMessage)
	DocGetDumpMessages       map[string](chan *GetDumpMessage)
	DocGetVersionsMessages   map[string](chan *GetVersionsMessage)
	DocStopContollerMessages map[string](chan interface{})
	Controllers              map[string]bool
	ContollerGroup           *sync.WaitGroup
	Clients                  map[*websocket.Conn]bool
	ClientDoc                map[ClientTab]Text
	Handlers                 map[string](func(request *IlexMessage, ws *websocket.Conn) error)
	Counter                  *NotificationCounter
}{
	StopServer:               make(chan interface{}),
	SocketControlMessages:    make(chan *websocket.Conn),
	TabControlMessages:       make(chan *ClientTabMessage),
	AllDocumentRequests:      make(chan *AllDocumentsRequest),
	DocumentUpdatedMessages:  make(chan *DocumentUpdate),
	NewDocumentRequests:      make(chan *NewDocumentRequest),
	DocAddTextMessages:       make(map[string](chan *AddTextMessage)),
	DocRemoveTextMessages:    make(map[string](chan *RemoveTextMessage)),
	DocChangeNameMessages:    make(map[string](chan *ChangeNameMessage)),
	DocTabControlMessages:    make(map[string](chan *ClientTabMessage)),
	DocGetDumpMessages:       make(map[string](chan *GetDumpMessage)),
	DocGetVersionsMessages:   make(map[string](chan *GetVersionsMessage)),
	DocStopContollerMessages: make(map[string](chan interface{})),
	Controllers:              make(map[string]bool),
	ContollerGroup:           &sync.WaitGroup{},
	Clients:                  make(map[*websocket.Conn]bool),
	ClientDoc:                make(map[ClientTab]Text),
	Counter:                  NewNotificationCounter(),
}

func init() {
	Globals.Handlers = map[string](func(request *IlexMessage, ws *websocket.Conn) error){
		DOCUMENT_ADD_TEXT:          documentAddText,
		DOCUMENT_CHANGE_NAME:       documentChangeName,
		DOCUMENT_GET_DUMP:          documentGetDump,
		DOCUMENT_GET_VERSIONS_INFO: documentGetVersionsInfo,
		DOCUMENT_REMOVE_TEXT:       documentRemoveText,
		GET_ALL_DOCUMENTS_INFO:     getAllDocumentsInfo,
		TAB_CLOSE:                  tabClose,
		CREATE_DOCUMENT:            createDocument,
	}
}
