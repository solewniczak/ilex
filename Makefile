BIN=server/server dbtool/dbtool

all: $(BIN)

$(BIN):
	cd $(shell dirname "$@"); go build -o $(shell basename "$@")
  
clean:
	rm $(BIN)
  
.PHONY: all clean