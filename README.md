http://ilex.imz.re/

1. Server side
    0. Set up a working Golang environment
        1. follow the following tutorials:  
		golang.org/doc/install  
		golang.org/doc/code.html  
		2. Install websockets library:  
            * `? go get golang.org/x/net/websocket`
		3. Install mgo library:  
            * `? go get gopkg.in/mgo.v2`

	1. Set up MongoDB:
		1. Install MongoDB 3.2, for example by following the instructions provided at
		https://docs.mongodb.com/master/tutorial/install-mongodb-on-ubuntu/
		2. If you install it with apt-get, it starts up automatically. Otherwise, you may need to run it by hand. Check with
	    	* `? service mongod status`
	    	* or equivalent command for your system.
		3. In console, go to ilex/dbtool directory, and run  
		    * `? go build`
		    * to build dbtool script used to work directly with the database. It's usage is as follows:
			  `? ./dbtool -c` //clear the database
    		  `? ./dbtool -f` //fill the database with a basic data sample. Use only after clearing!
			  `? ./dbtool -r` //read all documents form database and print info about them
		      `? ./dbtool -p` ../server/texts/powiesc_walejdoty.txt // add text file to db
		      `? ./dbtool -p` ../server/texts/xanadu.txt -n "Ted Nelson - Xanadu" // add text file to db with the given title``` 
		4. To see the data in the MongoDB, type "mongo" in console, an then, in the db console try the following commands:
    		*  ```? use default
		    ? db.permascroll.find({"No" : 2})
		    ? db.docs.find({"Name" : "Barańczak - Pan tu nie stał"})
		    Quit with "quit()"```
	2. Set up the ilex server.  
		1. In server directory:  
		    * `? go build`
		2. Run server

2. Open index.html in your web browser at http://localhost:9000
