"use strict"

let express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
// var apiaiApp = require('apiai')('79e3bdbc0c0f4a9887d788c7bf998216');
var token = 'EAAZAcDt7TSFwBAJL4gWZBAX8eyK5qEzQ37QWN6Dn75XY4rHgbU65uJ569B8hqdQAGI6eIquMmcj8XpuUVf4Cgb19xKD7IToMh2k3hgdwNfdz3ovi3ZCTZA82njU4bm9Y2Q7dlDK8MvaIaB7ZAuZChVZAvORUdEMs14luc2pW8VlPwZDZD';
var app = express();
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://elo:pizza_pass@ds155587.mlab.com:55587/elo-bot';

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000), function(){
  console.log('Express server is listening on port ' + app.get('port'));
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
  console.log(JSON.stringify(req.body));
  MongoClient.connect(url, function(err, db) {
    if(err) {
      console.log(err);
    }
    app.findCards(id, db, function(doc) {
      if(doc === null){
        app.initUserCards({session:id, cards:[]}, db, function(doc){
          db.close();
        })
      }
    });
  });
  app.speechHandler(text, id, function(speech){
    app.messageHandler(speech, id, function(result){
      console.log("Async Handled: " + result);
    })
  })
  res.send(req.body);
});
app.initUserCards = function(data, db, callback) {
  console.log("in init user cards");

  // Get the documents collection
  var collection = db.collection('card');
  // Insert some documents
  collection.insertOne(data, function(err, result) {
    if(err) throw err;
    callback(result);
  });
}

app.findCards = function(sessionID, db, callback) {
  console.log("in find cards");

  // Get the documents collection
  var collection = db.collection('card');
  // Find some documents
  collection.findOne({'session': sessionID}, function(err, doc) {
    if(err){ throw err; }
    callback(doc);
  });
}

app.addCard = function(data, sessionID, db, callback) {
  console.log("in add card");

  // Get the documents collection
  var collection = db.collection('card');
  // Find some documents
  collection.findOne({'session': sessionID}, function(err, doc) {
    if(err){ throw err; }
    console.log("******DOC*******");
    console.log(doc);
    doc.cards.push(data);
    console.log("******CARDS*******");
    console.log(doc.cards);
    console.log("******NEW DOC*******");
    console.log(doc);
    callback(doc);
  });
}

app.speechHandler = function(text, id, cb) {
  console.log("in speech handler");
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
        console.log("adding card to mongo");

        MongoClient.connect(url, function(err, db) {
          if(err) {
            console.log(err)
          }
          app.addCard({front:body.result.parameters.front, back:body.result.parameters.back}, id, db, function(doc){
            db.close();
          });
        });
        console.log("added card to mongo");
      }
      cb(body.result.fulfillment.speech);
    }
  });
}

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
