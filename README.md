http://ilex.imz.re/

1. Server side
	1. Set up MongoDB:
		* Install MongoDB 3.2, for example by following the instructions provided at
		https://docs.mongodb.com/master/tutorial/install-mongodb-on-ubuntu/

		* If you install it with apt-get, it starts up automatically. Otherwise, you may need to run it by hand. Check with
		? service mongod status
		or equivalent command for your system.

		* In console, go to ilex/db directory and populate the database with sample data:
		? mongoimport --db default --collection permascroll --drop --file ps2.json
		? mongoimport --db default --collection docs --drop --file docs.json
		
			What the first line does is to drop all data from collection "permascroll" 	from database "default" and re-fill it with data from file ps2.json.

		* To see the data in the MongoDB, type "mongo" in console, an then, in the db 	console try the following commands:
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
			?./build.sh
			Run server.bin
2. Open index.html in your web browser.
