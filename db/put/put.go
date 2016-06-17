package main

import (
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"log"
)

type ScrollPiece struct {
	Id   bson.ObjectId `bson:"_id"`
	No   int           `bson:"No"`
	Text string        `bson:"Text"`
	Full string        `bson:"Full"`
}

func main() {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("Did not find database!")
		panic(err)
	}
	defer db_session.Close()

	docs := db_session.DB("default").C("permascroll")

	n, err := docs.Find(bson.M{"Full": false}).Count()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Count: ", n)

	result1 := ScrollPiece{}
	err = docs.Find(bson.M{"No": 2}).One(&result1)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Id: ", result1.Id.String())
	fmt.Println("Text: ", result1.Text)
	fmt.Println("No: ", result1.No)

	var results []ScrollPiece
	err = docs.Find(bson.M{"Full": false}).All(&results)
	if err != nil {
		log.Fatal(err)
	}
	for i := 0; i < len(results); i++ {
		fmt.Println("No: ", results[i].No)
	}
}
