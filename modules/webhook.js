var winston = require('winston');
require('winston-papertrail').Papertrail;

var paperTrailLogger = new winston.Logger({
    transports: [
    new winston.transports.Papertrail({
        host: 'logs3.papertrailapp.com',
        port: 49786
    })
    ]
});


function log(error, ip, uid, route) {
    paperTrailLogger.info(JSON.stringify({
        "error": error,
        "ip": ip,
        "uid":uid,
        "route": route
    }));    
}
module.exports = {log:log};