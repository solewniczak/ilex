package main

import (
	"flag"
	"fmt"
	"gopkg.in/mgo.v2"
	"io/ioutil"
	"log"
	"path/filepath"
)

func main() {
	var clear_db = flag.Bool("c", false, "clear all data from the database")
	var fill_db = flag.Bool("f", false, "fill the database with a basic data set")
	var read_db = flag.Bool("r", false, "read all data from the database")
	var given_path = flag.String("p", "", "the file to be added to the fill_database")
	var document_name = flag.String("n", "", "(optional, use with -p) the name to be assigned to the document. If it's not specified, the file's name will be used instead")
	flag.Parse()

	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		panic(err)
	}
	defer db_session.Close()

	database := db_session.DB("default")

	file := (len(*given_path) != 0)
	flags_given := 0

	if *clear_db {
		flags_given++
	}
	if *fill_db {
		flags_given++
	}
	if *read_db {
		flags_given++
	}
	if file {
		flags_given++
	}

	if flags_given != 1 { // no flags or too many flags set
		flag.Usage()
		log.Fatal("Incorrect flag set!")
	}

	if *clear_db {
		clear_database(database)
	} else if *fill_db {
		fill_database(database)
	} else if *read_db {
		read_database(database)
	} else { // put file in database
		full_path, err := filepath.Abs(*given_path)

		if len(*document_name) == 0 {
			fmt.Println("No name specified! Using text file's name as document name.")
			*document_name = filepath.Base(full_path)
		}

		buffer, err := ioutil.ReadFile(full_path)
		if err != nil {
			log.Fatal(err)
		}
		add_doc(buffer, document_name, database)
	}
}
