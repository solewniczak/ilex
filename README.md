http://ilex.imz.re/

1. Server side
	1. Set up MongoDB:
	Install MongoDB 3.2, for example by following the instructions provided at
	https://docs.mongodb.com/master/tutorial/install-mongodb-on-ubuntu/

	Go to db directory and import the sample data:
	mongoimport --db default --collection permascroll --drop --file ps2.json

	If you install it with apt-get, it starts up automatically. Otherwise, you
		may need to run it by hand. Check with
		$ service mongod status

	2. Set up the ilex server. There are two variants:
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
2. Open index.html in your web browser.
