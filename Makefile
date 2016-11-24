BIN=server/server dbtool/dbtool
NW_PLATFORMS=linux64

all: deps $(BIN) nw

deps:
	go get golang.org/x/net/websocket
	go get gopkg.in/mgo.v2
	go get github.com/fatih/structs

$(BIN):
	cd $(shell dirname "$@"); go build -o $(shell basename "$@")
  
clean:
	rm $(BIN)
	
nw:
	nwbuild -p $(NW_PLATFORMS) --cacheDir ./nwbuild .
  
.PHONY: all deps clean nw