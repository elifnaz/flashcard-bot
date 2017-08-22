const mongoose = require('mongoose');
mongoose.Promise = require('bluebird'); // optional, use this to get rid of the mpromise DeprecationWarning
const conn = mongoose.createConnection('mongodb://elo:pizza_pass@ds155587.mlab.com:55587/elo-bot');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  session:  String,
  cards: [{front: String, back: String}]
}, {collection : 'card'});

const User = conn.model('User', UserSchema);

module.exports = User;
