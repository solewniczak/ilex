package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"unicode/utf8"
)

const (
	REQUEST_TEXT_DUMP = "requestTextDump"
	TAB               = "tab"
	TEXT              = "text"
	VERSION           = "version"

	TEXT_RETRIEVED = "textRetrieved"
	LINKS          = "links"

	RETRIEVAL_FAILED = "retrievalFailed"
	ERROR            = "error"
)

type SimpleLink [][2]string

func min(a, b int) int {
	if a < b {
		return a
	} else {
		return b
	}
}

func get_substring(source string, start_rune, end_rune int) string {
	i := 0
	var start_byte, end_byte int
	for pos, _ := range source {
		if i == start_rune {
			start_byte = pos
		}
		if i == end_rune {
			end_byte = pos
		}
		i++
	}
	if end_byte == 0 {
		end_byte = len(source)
	}
	return (source)[start_byte:end_byte]

}

func read_block_from_permascroll_to_buffer(runes_to_read, address int, buffer *bytes.Buffer, slices *mgo.Collection) error {
	var slice Slice
	// read from somewhere from first slice
	slice_no := address / SLICE_SIZE
	rune_no_in_slice := address % SLICE_SIZE

	err := slices.Find(bson.M{"No": slice_no}).One(&slice)
	if err != nil {
		return err
	}
	runes_in_slice := utf8.RuneCountInString(slice.Text)
	runes_to_read_from_slice := min(runes_in_slice-rune_no_in_slice, runes_to_read)
	buffer.WriteString(get_substring(slice.Text, rune_no_in_slice, rune_no_in_slice+runes_to_read_from_slice))

	runes_to_read -= runes_to_read_from_slice

	// read from subsequent slices starting from 0th rune
	for runes_to_read > 0 {
		slice_no++

		err := slices.Find(bson.M{"No": slice_no}).One(&slice)
		if err != nil {
			return err
		}

		runes_in_slice := utf8.RuneCountInString(slice.Text)
		runes_to_read_from_slice := min(runes_in_slice, runes_to_read)
		buffer.WriteString(get_substring(slice.Text, 0, runes_to_read_from_slice))

		runes_to_read -= runes_to_read_from_slice
	}

	return nil
}

func get_string_from_addresses(addresses [][2]int, total_runes int, database *mgo.Database) (*string, error) {
	// @ TO DO: add support for zero-length files

	slices := database.C("permascroll")
	var buffer bytes.Buffer
	last_address := len(addresses) - 1
	runes_read := 0
	for i, a := range addresses[0:last_address] {
		runes_to_read := addresses[i+1][0] - a[0]
		if err := read_block_from_permascroll_to_buffer(runes_to_read, a[1], &buffer, slices); err != nil {
			return nil, err
		}
		runes_read += runes_to_read
	}

	runes_to_read := total_runes - runes_read
	if err := read_block_from_permascroll_to_buffer(runes_to_read,
		addresses[last_address][1], &buffer, slices); err != nil {
		return nil, err
	}

	str := buffer.String()
	return &str, nil
}

func requestTextDump(request *IlexMessage, ws *websocket.Conn) error {
	requested_text_id := request.Parameters[TEXT].(string)

	response := NewIlexResponse(request)

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		response.Action = RETRIEVAL_FAILED
		response.Parameters[ERROR] = "Document error: " + err.Error()
		goto send
	}
	defer db_session.Close()

	{
		database := db_session.DB("default")
		docs := database.C("docs")

		var document Document
		err = docs.Find(bson.M{"_id": bson.ObjectIdHex(requested_text_id)}).One(&document)
		if err != nil {
			response.Action = RETRIEVAL_FAILED
			response.Parameters[ERROR] = "Document error: " + err.Error()
			goto send
		}

		// golang : all json numbers are unpacked to float64 values
		var requested_version int
		requested_version_float, ok := request.Parameters[VERSION].(float64)

		if ok {
			requested_version = int(requested_version_float)
		} else {
			requested_version = document.TotalVersions
		}

		if ok && requested_version > document.TotalVersions {
			response.Action = RETRIEVAL_FAILED
			response.Parameters[ERROR] = "version unavailable"
			goto send
		}

		versions := database.C("versions")

		var version Version
		err = versions.Find(bson.M{"DocumentId": document.Id,
			"No": requested_version}).One(&version)
		if err != nil {
			response.Action = RETRIEVAL_FAILED
			response.Parameters[ERROR] = "Version error: " + err.Error()
			goto send
		}

		retrieved, err := get_string_from_addresses(version.Addresses, version.Size, database)
		if err != nil {
			response.Action = RETRIEVAL_FAILED
			response.Parameters[ERROR] = err.Error()
			goto send
		}

		{
			// hard coded test links
			links := SimpleLink{
				{"1+10", "100+200"},
				{"1+10", "500+100"},
				{"200+20", "310+10"},
			}

			response.Action = TEXT_RETRIEVED
			response.Parameters[TEXT] = *retrieved
			response.Parameters[TAB] = request.Parameters[TAB]
			response.Parameters[LINKS] = links
		}

	}

send:
	js, _ := json.Marshal(response)
	fmt.Println("sending response: ", string(js))
	return websocket.JSON.Send(ws, response)
}
