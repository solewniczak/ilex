package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

func handle_signals() {
	sigchan := make(chan os.Signal)
	signal.Notify(sigchan, syscall.SIGINT)
	<-sigchan
	fmt.Println("\n\t\tRECEIVED SIGINT\n")
	Globals.StopServer <- true
}
