http://ilex.imz.re/

1. Server side
	0. Set up a working Golang environment
		* follow the following tutorials:  
		golang.org/doc/install  
		golang.org/doc/code.html  

		* Install websockets library:  
		? go get golang.org/x/net/websocket

		* Install mgo library:
		? go get gopkg.in/mgo.v2

	1. Set up MongoDB:
		* Install MongoDB 3.2, for example by following the instructions provided at
		https://docs.mongodb.com/master/tutorial/install-mongodb-on-ubuntu/

		* If you install it with apt-get, it starts up automatically. Otherwise, you may need to run it by hand. Check with
		? service mongod status
		or equivalent command for your system.

		* In console, go to ilex/db directory, and run
		? go build
		to build bd script used to fill the database. It's usage is as follows:
		? ./db -f														// fill the database with a basic data sample
		? ./db -p ../server/texts/powiesc_walejdoty.txt					// add
		text file to db
		? ./db -p ../server/texts/xanadu.txx -n "Ted Nelson - Xanadu"	// add
		text file to db with the given title
		

		* To see the data in the MongoDB, type "mongo" in console, an then, in the db console try the following commands:
		? use default
		? db.permascroll.find({"No" : 2})
		? db.docs.find({"Name" : "Barańczak - Pan tu nie stał"})
		Quit with "quit()"

	2. Set up the ilex server. There are two variants:
		1. PHP  
		* Install php7.0-cli:
		? sudo apt-get install php7.0-cli
	
		* Run WebSockets server:
		? php server/server.php
	
		2. GO  
			To set up a working Golang environment, follow the following tutorials:  
			golang.org/doc/install  
			golang.org/doc/code.html  
	
			Install websockets library:  
			? go get golang.org/x/net/websocket
	
			In go-server directory:  
			? go build
			Run go-server
2. Open index.html in your web browser.
