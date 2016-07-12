package main

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"log"
	"time"
	"unicode/utf8"
)

func min(a, b int) int {
	if a < b {
		return a
	} else {
		return b
	}
}

func length_of_first_n_runes_in_array(array []byte, n int) int {
	length := 0
	for i := 0; i < n; i++ {
		_, l := utf8.DecodeRune(array[length:])
		length += l
	}
	return length
}

func add_doc(file_contents []byte, document_name string, database *mgo.Database) {
	if !utf8.Valid(file_contents) {
		log.Fatal("The file is not a valid utf-8 text")
	}
	text_length_runes := utf8.RuneCount(file_contents)
	runes_written, bytes_written, total_runes_to_write := 0, 0, text_length_runes

	slices := database.C("permascroll")
	slice := Slice{}
	var document_address int

	total_slices, err := slices.Count()
	if total_slices == 0 {
		fmt.Println(`WARNING!
If you try to fill the database (using option -f) after this operation, your database will get corrupted!
`)
		slice.No = -1
		document_address = 0

	} else {
		// get the last slice:
		err = slices.Find(bson.M{"No": total_slices - 1}).One(&slice)
		if err != nil {
			log.Fatal(err)
		}

		slice_length_runes := utf8.RuneCountInString(slice.Text)
		document_address = (total_slices-1)*SLICE_SIZE + slice_length_runes

		empty_space := SLICE_SIZE - slice_length_runes
		if empty_space != 0 {
			// fill the slice with some of the buffer
			runes_to_write := min(empty_space, total_runes_to_write)
			length_to_write := length_of_first_n_runes_in_array(file_contents[bytes_written:], runes_to_write)
			slice.Text = slice.Text + string(file_contents[bytes_written:bytes_written+length_to_write])
			if err = slices.UpdateId(slice.Id, bson.M{"$set": bson.M{"Text": slice.Text}}); err != nil {
				log.Fatal(err)
			}
			total_runes_to_write -= runes_to_write
			runes_written += runes_to_write
			bytes_written += length_to_write
		}
	}

	for total_runes_to_write != 0 {
		slice.No += 1
		slice.Id = bson.NewObjectId()
		runes_to_write := min(total_runes_to_write, SLICE_SIZE)
		length_to_write := length_of_first_n_runes_in_array(file_contents[bytes_written:], runes_to_write)
		slice.Text = string(file_contents[bytes_written : bytes_written+length_to_write])
		if err = slices.Insert(&slice); err != nil {
			log.Fatal(err)
		}
		total_runes_to_write -= runes_to_write
		runes_written += runes_to_write
		bytes_written += length_to_write
	}

	now := time.Now()
	now_as_string := now.Format(time.RFC3339)
	document := Document{bson.NewObjectId(), "utf-8 encoded text file", "plain text", now_as_string, now_as_string, 1}

	version := Version{bson.NewObjectId(), document.Id, 1, document_name, now_as_string, now_as_string, text_length_runes, [][2]int{[2]int{0, document_address}}}

	docs := database.C("docs")
	if err = docs.Insert(document); err != nil {
		log.Fatal(err)
	}

	versions := database.C("versions")
	if err = versions.Insert(version); err != nil {
		log.Fatal(err)
	}

	fmt.Println("Document >>", document_name, "<< inserted successfully!")
}
