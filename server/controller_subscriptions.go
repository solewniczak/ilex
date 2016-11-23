package main

type ControllerSubscriptions struct {
	AddTextMessages        chan *AddTextMessage
	RemoveTextMessages     chan *RemoveTextMessage
	ChangeNameMessages     chan *ChangeNameMessage
	TabControlMessages     chan *ClientTabMessage
	DocDumpMessages        chan *GetDumpMessage
	GetVersionsMessages    chan *GetVersionsMessage
	GetHalfLinkMessages    chan *GetHalfLinkMessage
	NewHalfLinkMessages    chan *NewHalfLinkMessage
	StopControllerMessages chan interface{}
}

func NewControllerSubscriptions() *ControllerSubscriptions {
	return &ControllerSubscriptions{
		make(chan *AddTextMessage),
		make(chan *RemoveTextMessage),
		make(chan *ChangeNameMessage),
		make(chan *ClientTabMessage),
		make(chan *GetDumpMessage),
		make(chan *GetVersionsMessage),
		make(chan *GetHalfLinkMessage),
		make(chan *NewHalfLinkMessage, 100),
		make(chan interface{}),
	}
}

func (s *ControllerSubscriptions) Subscribe(documentId string) {
	Globals.DocAddTextMessages[documentId] = s.AddTextMessages
	Globals.DocRemoveTextMessages[documentId] = s.RemoveTextMessages
	Globals.DocChangeNameMessages[documentId] = s.ChangeNameMessages
	Globals.DocTabControlMessages[documentId] = s.TabControlMessages
	Globals.DocGetDumpMessages[documentId] = s.DocDumpMessages
	Globals.DocGetVersionsMessages[documentId] = s.GetVersionsMessages
	Globals.DocGetHalfLinkMessages[documentId] = s.GetHalfLinkMessages
	Globals.DocNewHalfLinkMessages[documentId] = s.NewHalfLinkMessages
	Globals.DocStopContollerMessages[documentId] = s.StopControllerMessages
}

func (s *ControllerSubscriptions) Close() {
	// this closes the channels in the global maps
	close(s.AddTextMessages)
	close(s.RemoveTextMessages)
	close(s.ChangeNameMessages)
	close(s.TabControlMessages)
	close(s.DocDumpMessages)
	close(s.GetVersionsMessages)
	close(s.GetHalfLinkMessages)
	close(s.NewHalfLinkMessages)
	close(s.StopControllerMessages)
}
