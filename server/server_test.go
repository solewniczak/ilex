package main

import (
	"fmt"
	"testing"
	"time"
)

func TestActionServer(t *testing.T) {
	go main()

	time.Sleep(time.Second)
	fmt.Println("aweakened")
	StopServer <- 1
}
