"use strict"

let express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var token = 'EAAZAcDt7TSFwBAJL4gWZBAX8eyK5qEzQ37QWN6Dn75XY4rHgbU65uJ569B8hqdQAGI6eIquMmcj8XpuUVf4Cgb19xKD7IToMh2k3hgdwNfdz3ovi3ZCTZA82njU4bm9Y2Q7dlDK8MvaIaB7ZAuZChVZAvORUdEMs14luc2pW8VlPwZDZD';
var app = express();
// var MongoClient = require('mongodb').MongoClient;
var User = require('./mongoose.js');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000), function(){
  // console.log('Express server is listening on port 5000' + app.get('port'));
  console.log('Express server is listening on port 5000');
});

app.get("/", function (req, res) {
    res.send("Deployed!");
});

// Used for Facebook Webhook verification
app.get("/webhook", function (req, res) {
    if (req.query["hub.verify_token"] === 'i_love_pizza') {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

// accept incoming messages
app.post('/webhook', function(req, res){
  console.log("in webhook post");

  var id = req.body.entry[0].messaging[0].sender.id;
  var text = req.body.entry[0].messaging[0].message.text;
  // console.log(JSON.stringify(req.body));
    User.findOne({'session': id}, function(err, doc) {
      if(doc === null){
        app.initUserCards(id, function(doc){
          console.log("initing cards");
        });
      }
      else console.log("found user session");
      if(err){ throw err; }
    });
  // MongoClient.connect(url, function(err, db) {
  //   if(err) {
  //     console.log(err);
  //   }
  //   app.findCards(id, db, function(doc) {
  //     if(doc === null){
  //       app.initUserCards({session:id, cards:[]}, db, function(doc){
  //         db.close();
  //       })
  //     }
  //   });
  // });
  app.speechHandler(text, id, function(speech){
    app.messageHandler(speech, id, function(result){
      console.log("Async Handled: " + result);
    })
  })
  // res.send(req.body);
  res.sendStatus(200).end();
});

app.initUserCards = function(id, callback) {

  var curUser = new User({session: id, cards:[]})
  console.log("Setting up new user with session id " + curUser.session);

  curUser.save(function (err, curUser) {
    if (err) return console.error(err);
    callback(curUser);
  });
};

app.findCards = function(sessionID, callback) {
  console.log("in find cards")
  User.findOne({'session': sessionID}, function(err, doc) {
    if(err){ throw err; }
    console.log("found user session");
    callback(doc);
  });
}

app.addCard = function(data, sessionID, callback) {
  // console.log("in add card");
  User.findOneAndUpdate(
    {session: sessionID},
    {$push: {cards: data}},
    {safe: true, upsert: true},
    function(err, model) {
        if (err) console.log(err);
        else callback(model);
    }
  );
};

// Connect to API.AI to get fulfillment (small talk / Card intent / Practice intent)
app.speechHandler = function(text, id, cb) {
  var reqObj = {
    url: 'https://api.api.ai/v1/query?v=20150910',
    headers: {
      "Content-Type":"application/json",
      "Authorization":"Bearer 79e3bdbc0c0f4a9887d788c7bf998216"
    },
    method: 'POST',
    json: {
      "query":text,
      "lang":"en",
      "sessionId":id
    }
  };
  request(reqObj, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', JSON.stringify(error));
      cb(false)
    } else {
      console.log(JSON.stringify(body))
      if(body.result.parameters.front !== "" && body.result.parameters.back !== "")
      {
          app.addCard({front:body.result.parameters.front, back:body.result.parameters.back}, id, function(doc){
            // console.log("USER: " + JSON.stringify(doc));
          })
      }
      cb(body.result.fulfillment.speech);
    }
  });
};

// send the message api.ai generated
app.messageHandler = function(text, id, cb) {
  console.log("in message handler");
  var data = {
    "recipient":{
    	"id":id
    },
    "message":{
    	"text":text
    }
  };
  var reqObj = {
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: data
  };
  console.log(JSON.stringify(reqObj));
  request(reqObj, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', JSON.stringify(error));
      cb(false);
    } else if (response.body.error) {
      console.log("API Error: " + JSON.stringify(response.body.error));
      cb(false);
    } else{
      console.log("cb true");
      cb(true);
    }
  });
}

module.exports = app;
