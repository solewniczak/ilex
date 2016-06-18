package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
)

func main() {
	var fill_db = flag.Bool("f", false, "fill the database with a basic data set (use without others)")
	var given_path = flag.String("p", "", "the file to be added to the database (use without -f)")
	var document_name = flag.String("n", "", "(optional, use with -p) the name to be assigned to the document. If it's not specified, the file's name will be used instead")
	flag.Parse()

	fill := *fill_db
	file := (len(*given_path) != 0)

	if fill == file { // both or neither flag set
		flag.Usage()
		log.Fatal("Incorrect flag set!")
	}

	if file {
		full_path, err := filepath.Abs(*given_path)

		if len(*document_name) == 0 {
			fmt.Println("No name specified! Using text file's name as document name.")
			*document_name = filepath.Base(full_path)
		}

		buffer, err := ioutil.ReadFile(full_path)
		if err != nil {
			log.Fatal(err)
		}
		add_doc(buffer, document_name)
	} else { // fill
		fill_database()
	}
}

//	var slices []Slice
//	err = slices.Find(bson.M{"Full": true}).All(&slices)
//	if err != nil {
//		log.Fatal(err)
//	}
