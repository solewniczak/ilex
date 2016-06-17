package main

import (
	"flag"
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"io/ioutil"
	"log"
	"path/filepath"
)

const SLICE_SIZE = 1000

type Slice struct {
	Id   bson.ObjectId `bson:"_id"`
	No   int           `bson:"No"`
	Text string        `bson:"Text"`
	Full string        `bson:"Full"`
}

func min(a, b int) int {
	if a < b {
		return a
	} else {
		return b
	}
}

func main() {
	var given_path = flag.String("f", "", "the file to be added to the database")
	var document_name = flag.String("n", "", "(optional) the name to be assigned to the document. If it's not specified, the file's name will be used instead")
	flag.Parse()

	if len(*given_path) == 0 {
		flag.Usage()
		log.Fatalln("No file specified!")
	}

	full_path, err := filepath.Abs(*given_path)

	if len(*document_name) == 0 {
		fmt.Println("No name specified! Using text file's name as document name.")
		*document_name = filepath.Base(full_path)
	}

	buffer, err := ioutil.ReadFile(full_path)
	if err != nil {
		log.Fatal(err)
	}

	full_text := string(buffer)
	text_length := len(full_text)
	runes_written, total_to_write := 0, len(full_text)

	// - - - - - - - - - - - - - - - - - - -

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		panic(err)
	}
	defer db_session.Close()

	slices := db_session.DB("default").C("permascroll")

	total_slices, err := slices.Count()
	// @ TO DO: handle empty permascroll

	// get the last slice:
	slice := Slice{}
	err = slices.Find(bson.M{"No": total_slices - 1}).One(&slice)
	if err != nil {
		log.Fatal(err)
	}

	slice_text_length := len(slice.Text)
	document_address := (total_slices-1)*SLICE_SIZE + slice_text_length

	empty_space := SLICE_SIZE - slice_text_length
	if empty_space != 0 {
		// fill the slice with some of the buffer
		to_write := min(empty_space, total_to_write)
		slice.Text = slice.Text + full_text[runes_written:to_write]
		if err = slices.UpdateId(slice.Id, bson.M{"$set": bson.M{"Text": slice.Text}}); err != nil {
			log.Fatal(err)
		}
		total_to_write -= to_write
		runes_written += to_write
	}

	for total_to_write != 0 {
		slice.No += 1
		slice.Id = bson.NewObjectId()
		to_write := min(total_to_write, SLICE_SIZE)
		slice.Text = full_text[runes_written : runes_written+to_write]
		if err = slices.Insert(&slice); err != nil {
			log.Fatal(err)
		}
		total_to_write -= to_write
		runes_written += to_write
	}

}

//	var slices []Slice
//	err = slices.Find(bson.M{"Full": true}).All(&slices)
//	if err != nil {
//		log.Fatal(err)
//	}
