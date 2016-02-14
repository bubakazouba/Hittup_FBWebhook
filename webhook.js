var fs = require('fs'),
    express = require('express'),
    bodyParser = require('body-parser'),
    ObjectID = require('mongodb').ObjectID,
    winston = require('winston'),
    mongodb = require('./modules/db'),
    Logger = require('./modules/Logger'),
    User = require('./models/Users'),
    Facebook = require('./modules/facebook'),
    mongodb = require('./modules/db');


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

mongodb.connect("mongodb://Hittup:katyCherry1738@ds043981.mongolab.com:43981/hittup", function(err, db) {
    if (err) {
        console.log(err);
        return(err);
      }
      else{
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

    var entries = req.body.entry;
    for (var i = entries.length - 1; i >= 0; i--) {
        if(!entries[i].hasOwnProperty("id")){
            return;//log error
        }
        console.log(req.body);
        var fbid = entries[i].id;
        //what if user comes with new facebook friend 
        var query = User.findOne({fbid: fbid});
        query.exec(function (err, userFound){
            if(err){
                console.log("couldnt get user");//log error
                return;
            }
            var fbToken = userFound.fbToken;
            console.log("fbid="+fbid+",success found user in DB, got the fbToken="+fbToken);
            Facebook.getFbData(fbToken, function (err, firstName, lastName, friends) {
                if(err){
                    Logger.log(err.message,req.connection.remoteAddress, null, "webhook");
                    return;
                }
                var fbids = [];
                for (var i = friends.length - 1; i >= 0; i--) {
                    fbids.push(friends[i].id);
                }
                console.log("fbid="+fbid+", success found friends from facebook= "+fbids)
                var query = User.find({fbid: { $in: fbids }});

                query.exec(function (err,userFriends) {
                    if(err) {
                        console.log("error="+err.message);
                        //Log error
                        return;
                    }
                    console.log("fbid="+fbid+",success found friends in DB");
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
        });//end get user's fb token

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