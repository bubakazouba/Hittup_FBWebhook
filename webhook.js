var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var mongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID
var winston = require('winston');

require('winston-papertrail').Papertrail;

var paperTrailLogger = new winston.Logger({
    transports: [
    new winston.transports.Papertrail({
        host: 'logs3.papertrailapp.com',
        port: 11470
    })
    ]
});

var LOGS_DIRECTORY='./FB_WEBHOOK';

if (!fs.existsSync(LOGS_DIRECTORY)) {//make sure './log' exists
    fs.mkdirSync(LOGS_DIRECTORY);
}
var app = express();


app.use(bodyParser.json());

mongoClient.connect("mongodb://Hittup:katyCherry1738@ds033865.mongolab.com:33865/hittupsahmoudtest", function(err, db) {
    if (err) {
        console.log(err);
        return(err);
      }
      else{
        mongoDatabase = db;
        userCollection = mongoDatabase.collection("Users");
        console.log("connected to db: " + db);
  }
});



app.post('/',function(req,res){
    filePath = LOGS_DIRECTORY+'/'+Date.now()+'-'+Math.random(); //logging req.body
    fs.writeFile(filePath+'.txt', JSON.stringify(req.body), function (error) {
        if(error){
            paperTrailLogger.info('ERROR while writing: '+error.message);
        }
    });

    var body=req.body;
    if(!(body.hasOwnProperty("entry") && body.entry.length == 2)){
        return;
    }
    for (var i = body.entry.length - 1; i >= 0; i--) {
        if(!body.entry[i].hasOwnProperty("id")){
            return
        }
    };
    var user0id = body.entry[0].id;
    var user1id = body.entry[1].id;
    
    userCollection.find({$or: [{fbid: user0id}, {fbid: user1id}] }).toArray(function(error,docs){

        if(error){
            fs.appendFile(filePath+'.txt', error.message, function (error) {
                if(error){
                    paperTrailLogger.info('ERROR while writing: '+error.message);
                }
            });
            return;
        }

        for (var i = docs.length - 1; i >= 0; i--) {
            var otherUser = docs[1-i];
            var shouldUpdate = true;
            if(docs[i].hasOwnProperty("fbFriends")){
                for (var j = docs[i]["fbFriends"].length - 1; j >= 0; j--) {
                    if(docs[i]["fbFriends"][j]._id.toString()==otherUser._id.toString())
                        shouldUpdate = false;
                }
            }

            if (shouldUpdate){
                userCollection.update(
                    {
                        fbid: docs[i].fbid
                    },
                    { 
                        $push: {
                            fbFriends: { 'fbid': otherUser.fbid, '_id': otherUser._id, 
                            'firstName': otherUser.firstName, 'lastName': otherUser.lastName,
                            'loc': otherUser.loc}
                        }
                    });
            }//end if should update
        }//end for
    });

    res.writeHead(200);
    res.end();
});



app.listen(9000);

//format of FB request:
// {
//   "object": "user",
//   "entry": [
//     {
//       "uid": "1944555855770464",
//       "id": "1944555855770464",
//       "time": 1451536175,
//       "changed_fields": [
//         "friends"
//       ]
//     },
//     {
//       "uid": "10153606455569181",
//       "id": "10153606455569181",
//       "time": 1451536175,
//       "changed_fields": [
//         "friends"
//       ]
//     }
//   ]
// }