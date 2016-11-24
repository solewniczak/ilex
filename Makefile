BIN=server/server dbtool/dbtool

all: deps $(BIN)

deps:
	go get golang.org/x/net/websocket
	go get gopkg.in/mgo.v2
	go get github.com/fatih/structs

$(BIN):
	cd $(shell dirname "$@"); go build -o $(shell basename "$@")
  
clean:
	rm $(BIN)
  
.PHONY: all deps clean