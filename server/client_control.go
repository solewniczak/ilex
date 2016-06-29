package main

import (
	"fmt"
)

var ClientControlMessages chan ClientTabDoc = make(chan ClientTabDoc)

func ControlClients(stop_client_control chan bool) {
	for {
		select {
		case message := <-ClientControlMessages:
			fmt.Println("Yes activity", message)
			return
		case <-stop_client_control:
			fmt.Println("Stop activity")
			return
		}
	}
}
