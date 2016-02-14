var https = require('https');
var url = require('url');
// Credit: http://stackoverflow.com/questions/13108995/how-to-get-facebook-friends-from-facebook-api-with-node-js


/*
getData:
    facebook retrieves facebook friends in pages of 25 in each page, then provides a url for the next page
    the first page contains: first_name,last_name, friends: {data:[friends list], paging:{next:url}}
    other pages contain: data:[friends list],paging:{next:url}
*/
var getData = function(path, friends, firstName, lastName, callback) {
    var options = {
        host: 'graph.facebook.com',
        port: 443,
        path: path,
        method: 'GET'
    };
    var buffer = ''; 
    var request = https.get(options, function(result){
        result.setEncoding('utf8');

        result.on('data', function(chunk){
            buffer += chunk;
        });

        result.on('end', function(){
            data = JSON.parse(buffer);
            if (data.error) {
                return callback(data.error);
            }

            if(data.first_name) { //then it's the first time
                firstName = data.first_name;
                lastName = data.last_name;
                if(data.friends.paging.next){
                    nextPath = url.parse(data.friends.paging.next).path;
                } else {
                    nextPath = null;
                }
                friends = data.friends.data;
            }
            else { //it's not the first time
                if(data.paging.next){
                    nextPath = url.parse(data.paging.next).path;
                } else {
                    nextPath = null;
                }

                for (var i = data.data.length - 1; i >= 0; i--) {
                    friends.push(data.data[i]);
                }
            }
            if(!nextPath) {
                callback(null, firstName, lastName, friends);
            }
            else {
                getData(nextPath, friends, firstName, lastName, callback);
            }
        });
    });

    request.on('error', function(err){
        callback(err);
    });

    request.end();
};

exports.getFbData = function(access_token, callback) {
    path = '/v2.5/me?fields=first_name,last_name,friends&access_token='+access_token;
    getData(path, {}, "", "", callback);
};

module.exports = exports;