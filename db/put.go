package main

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"log"
	"time"
)

func min(a, b int) int {
	if a < b {
		return a
	} else {
		return b
	}
}

func add_doc(file_contents []byte, document_name *string, database *mgo.Database) {
	fmt.Println("Document inserted successfully!")
	full_text := string(file_contents)
	text_length := len(full_text)
	runes_written, total_to_write := 0, len(full_text)

	slices := database.C("permascroll")

	total_slices, err := slices.Count()
	fmt.Println(total_slices)
	// @ TO DO: handle empty permascroll

	// get the last slice:
	slice := Slice{}
	err = slices.Find(bson.M{"No": total_slices - 1}).One(&slice)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Document inserted successfully!")

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

	now := time.Now()
	now_as_string := now.Format(time.RFC3339)
	document := Document{bson.NewObjectId(), *document_name, "utf-8 encoded text file", "plain text", now_as_string, now_as_string, 1}

	version := Version{bson.NewObjectId(), document.Id, 1, now_as_string, now_as_string, text_length, [][2]int{[2]int{0, document_address}}}

	docs := database.C("docs")
	if err = docs.Insert(document); err != nil {
		log.Fatal(err)
	}

	versions := database.C("versions")
	if err = versions.Insert(version); err != nil {
		log.Fatal(err)
	}

	fmt.Println("Document >>", *document_name, "<< inserted successfully!")
}
