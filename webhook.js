var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var mongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID
var winston = require('winston');
var mongodb = require('./modules/db');
var Logger = require('../modules/Logger');
var Facebook = require('../modules/facebook');


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

mongoClient.connect("mongodb://Hittup:katyCherry1738@ds043981.mongolab.com:43981/hittup", function(err, db) {
    if (err) {
        console.log(err);
        return(err);
      }
      else{
        mongoDatabase = db;
        userCollection = mongoDatabase.collection("Users");
        console.log("DB Connected");
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
    if(!body.hasOwnProperty("entry")){
        return;//log error
    }

    var entries = req.body.entries;
    for (var i = entries.length - 1; i >= 0; i--) {
        if(!entries[i].hasOwnProperty("id")){
            return;//log error
        }

        var fbid = entries[i].id;

        Facebook.getFbData(req.body.fbToken, function (err, firstName, lastName, friends) {
            if(err){
                Logger.log(err.message,req.connection.remoteAddress, null, "webhook");
                return;
            }
            res.sendStatus(200);
            var fbids = [];
            for (var i = friends.length - 1; i >= 0; i--) {
                fbids.push(friends[i].id);
            }
            
            var query = User.find({fbid: { $in: fbids }});

            query.exec(function (err,userFriends) {
                if(err) {
                    res.send({"success": "false", "error": err.message});
                    return;
                }
                var fbFriends = [];
                for (var i = userFriends.length - 1; i >= 0; i--) {
                    fbFriends.push(userFriends[i]._id);
                }
                var user = new User({
                    fbFriends: fbFriends
                });

                user.update(function (err,updatedUser) {
                    if(err){
                        Logger.log(err.message,req.connection.remoteAddress, null, "update user in webhook");
                    }
                    console.log("updated user successfully");
                });//end update user
            });//end look for friends
        });//end get friends from facebook

    }

    res.sendStatus(200);
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