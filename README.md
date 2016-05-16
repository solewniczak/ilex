http://ilex.imz.re/

1. Server side
	1. PHP  
	Install php7.0-cli:

	sudo apt-get install php7.0-cli

	Run WebSockets server:

	php server/server.php

	2. GO  
	To set up a working Golang environment, follow the following tutorials:  
	golang.org/doc/install  
	golang.org/doc/code.html  

	Install websockets library:  
	go get golang.org/x/net/websocket

	In go-server directory:  
	go build server.go 
	Run it.

3. Open index.html in your web browser.
