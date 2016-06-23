package main

// the backticks are hints for the golang JSON marshaller -
// - names of the struct's json fields
type IlexMessage struct {
	Action     string                 `json:"action"`
	Parameters map[string]interface{} `json:"parameters"`
}

func (im *IlexMessage) Init() {
	im.Parameters = make(map[string]interface{})
}
