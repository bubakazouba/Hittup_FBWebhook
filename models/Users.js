var mongoose  = require('mongoose');
var Schema  = mongoose.Schema;

var UserSchema   = new Schema({
    fbid: String,
    firstName: String,
    lastName: String,
    fbToken: String,
    deviceTokens: [String],
    loc: { 
        type: { type: String },
         coordinates: [ ] ,// [<longitude>, <latitude>]
         city: String,
         state: String,
         lastUpdatedTime: Number
    },
    fbFriends:[{ type: Schema.ObjectId, ref: 'Users' }]
}, {collection: 'Users'});

UserSchema.index({ loc: '2dsphere' });
module.exports = mongoose.model('Users', UserSchema);