package main

// the backticks are hints for the golang JSON marshaller -
// - names of the struct's json fields
type IlexMessage struct {
	Action     string                 `json:"action"`
	Parameters map[string]interface{} `json:"parameters"`
	Id         int                    `json:"id"`
}

func NewIlexMessage() *IlexMessage {
	im := new(IlexMessage)
	im.Parameters = make(map[string]interface{})
	return im
}

func NewIlexResponse(request *IlexMessage) *IlexMessage {
	im := NewIlexMessage()
	im.Id = request.Id
	return im
}
