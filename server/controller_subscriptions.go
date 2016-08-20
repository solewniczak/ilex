package main

type ControllerSubscriptions struct {
	AddTextMessages        chan *AddTextMessage
	RemoveTextMessages     chan *RemoveTextMessage
	TabControlMessages     chan *ClientTabMessage
	DocDumpMessages        chan *GetDumpMessage
	GetVersionsMessages    chan *GetVersionsMessage
	StopControllerMessages chan interface{}
}

func NewControllerSubscriptions() *ControllerSubscriptions {
	return &ControllerSubscriptions{
		make(chan *AddTextMessage),
		make(chan *RemoveTextMessage),
		make(chan *ClientTabMessage),
		make(chan *GetDumpMessage),
		make(chan *GetVersionsMessage),
		make(chan interface{}),
	}
}

func (s *ControllerSubscriptions) Subscribe(documentId string) {
	Globals.DocAddTextMessages[documentId] = s.AddTextMessages
	Globals.DocRemoveTextMessages[documentId] = s.RemoveTextMessages
	Globals.DocTabControlMessages[documentId] = s.TabControlMessages
	Globals.DocGetDumpMessages[documentId] = s.DocDumpMessages
	Globals.DocGetVersionsMessages[documentId] = s.GetVersionsMessages
	Globals.DocStopContollerMessages[documentId] = s.StopControllerMessages
}

func (s *ControllerSubscriptions) Close() {
	// this closes the channels in the global maps
	close(s.AddTextMessages)
	close(s.RemoveTextMessages)
	close(s.TabControlMessages)
	close(s.DocDumpMessages)
	close(s.GetVersionsMessages)
	close(s.StopControllerMessages)
}
