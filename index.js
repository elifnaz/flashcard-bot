"use strict"

let express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var apiaiApp = require('apiai')('79e3bdbc0c0f4a9887d788c7bf998216');
var token = 'EAAZAcDt7TSFwBAJL4gWZBAX8eyK5qEzQ37QWN6Dn75XY4rHgbU65uJ569B8hqdQAGI6eIquMmcj8XpuUVf4Cgb19xKD7IToMh2k3hgdwNfdz3ovi3ZCTZA82njU4bm9Y2Q7dlDK8MvaIaB7ZAuZChVZAvORUdEMs14luc2pW8VlPwZDZD';
var app = express();
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://<dbuser>:<dbpassword>@ds155587.mlab.com:55587/elo-bot';

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000), function(){
  console.log('Express server is listening on port ' + app.get('port'));
});


// Server index page
app.get("/", function (req, res) {
    res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
    if (req.query["hub.verify_token"] === 'i_love_pizza') {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});


// app.messageHandler = function(text, id, cb) {
//   var data = {
//     "recipient":{
//     	"id":id
//     },
//     "message":{
//     	"text":text
//     }
//   };
//   var reqObj = {
//     url: 'https://graph.facebook.com/v2.6/me/messages',
//     qs: {access_token:token},
//     method: 'POST',
//     json: data
//   };
//   console.log(JSON.stringify(reqObj))
//   request(reqObj, function(error, response, body) {
//     if (error) {
//       console.log('Error sending message: ', JSON.stringify(error));
//       cb(false)
//     } else if (response.body.error) {
//       console.log("API Error: " + JSON.stringify(response.body.error));
//       cb(false)
//     } else{
//       cb(true)
//     }
//   });
// }
//
// app.speechHandler = function(text, id, cb) {
//   var reqObj = {
//     url: 'https://api.api.ai/v1/query?v=20150910',
//     headers: {
//       "Content-Type":"application/json",
//       "Authorization":"Bearer 4485bc23469d4607b19a3d9d2d24b112"
//     },
//     method: 'POST',
//     json: {
//       "query":text,
//       "lang":"en",
//       "sessionId":id
//     }
//   };
//   request(reqObj, function(error, response, body) {
//     if (error) {
//       console.log('Error sending message: ', JSON.stringify(error));
//       cb(false)
//     } else {
//       console.log(JSON.stringify(body))
//       cb(body.result.fulfillment.speech);
//     }
//   });
// }

app.post('/webhook', function(req, res){
  // var id = req.body.entry[0].messaging[0].sender.id;
  // var text = req.body.entry[0].messaging[0].message.text;
  //
  // console.log(JSON.stringify(req.body));
console.log("webhook");
if (req.body.result) {
console.log("****req body result is:" + req.body.result);
if (req.body.result.action)
console.log("****req body result action is:" + req.body.result.action);
}
  // Make sure this is a page subscription
  if (req.body.object === "page") {
      // Iterate over each entry
      // There may be multiple entries if batched
      req.body.entry.forEach(function(entry) {
          // Iterate over each messaging event
          entry.messaging.forEach(function(event) {
              if(event.postback){
                request({
                    url: "https://graph.facebook.com/v2.6/me/messages",
                    qs: {access_token: token},
                    method: 'POST',
                    json: {
                        recipient: {id: recipientId},
                        message: {text: message},
                    }
                }, function(error, response, body) {
                  console.log("sending postback reply");
                    if (error) {
                        console.log("Error sending message: " + response.error);
                    }
                });
              }else if(event.message && event.message.text){
                  sendMessage(event);
              }
          });
      });

      res.sendStatus(200).end();
  }
});

function processPostback(event) {
    var senderId = event.sender.id;
    var payload = event.postback.payload;
    console.log("********payload is: " + payload);
    MongoClient.connect(url, function(err, db) {
      console.log("connecting to mongo");
    if(err) {
      console.log(err)
    }
    app.findCards(id, db, function(cards) {
      if(cards === null){
        console.log("cards null right now");
        app.initUserCards({session:id, card:[]}, db, function(cards){
          console.log("initing cards");
          db.close();
        })
      }
    });
  });
    if (payload === "FACEBOOK_WELCOME") {
        // Get user's first name from the User Profile API
        // and include it in the greeting
        request({
            url: "https://graph.facebook.com/v2.9/" + senderId,
            qs: {
                access_token: token,
                fields: "first_name"
            },
            method: 'GET'
        }, function(error, response, body) {
            var greeting = "";
            if (error) {
                console.log("Error getting user's name: " +  error);
            } else {
                var bodyObj = JSON.parse(body);
                var name = bodyObj.first_name;
                var greeting = "Hi " + name + ". ";
            }
            var message = greeting + "I'm Elo, your personal flash card bot.";
            sendGreeting(senderId, message);
        });
    }
}


function sendGreeting(recipientId, message){
  console.log("in send greeting");
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: {text: message},
        }
    }, function(error, response, body) {
      console.log("before send options");
        if (error) {
            console.log("Error sending message: " + response.error);
        }
        // else sendOptions(recipientId);
    });
}

function sendOptions(recipientId){
  console.log("in send options");

  var data = {
    "recipient":{
      "id":recipientId,
    },
    "message":{
      "text": "Select one of the options:",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Add Flash Card",
          "payload":"ADD_CARD",
        },
        {
          "content_type":"text",
          "title":"Practice",
          "payload":"PRACTICE",
        }
        // {
        //   "content_type":"text",
        //   "title":"View Cards",
        //   "payload":"POSTBACK_PAYLOAD3"
        // }
      ]
    }
  }
  request({
             url: 'https://graph.facebook.com/v2.6/me/messages',
             qs: {access_token: token},
             method: 'POST',
             json: data
         }, (error, response) => {
             if (error) {
                 console.log("Error sending message: " + response.error);
             } else if (response.body.error){
                 console.log('Error: ', response.body.error);
             }
         });
}



//
// sends message to user using api.ai's api
function sendMessage(event) {
  console.log("in send message");
  if (event.postback) console.log("but its postback");
    let sender = event.sender.id;
    let text = event.message.text;

    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'hire_me'
    });

    apiai.on('response', (response)=>{
      console.log("API AI RESPONSE: ");
      console.log(response);
        let action = response.result.action;
        let aiText = response.result.fulfillment.speech;
        if (action === "add-card") {
          console.log("add card selected!");
          MongoClient.connect(url, function(err, db) {
          if(err) {
            console.log(err)
          }
          console.log("before add card func");
          app.addCard({front:response.result.parameters.front, back:response.result.parameters.back}, id, db, function(card){
            db.close();
          });
          console.log("after add card func");
        });
        }

        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: token},
            method: 'POST',
            json: {
                recipient: {id: sender},
                message: {text : aiText}
            }
        }, (error, response) => {
            if (error) {
                console.log("Error sending message: " + response.error);
            } else if (response.body.error){
                console.log('Error: ', response.body.error);
            }
            else {
              console.log("no error?");
              sendOptions(event.sender.id);
            }
        });
    });

    apiai.on('error',(error)=> {
        console.log(error);
    });

    apiai.end();

}

app.initUserCards = function(data, db, callback) {
  // Get the documents collection
  var collection = db.collection('card');
  // Insert some documents
  collection.insertOne(data, function(err, result) {
    if(err) throw err;
    callback(result);
  });
}

app.findCards = function(sessionID, db, callback) {
  // Get the documents collection
  var collection = db.collection('card');
  // Find some documents
  collection.findOne({'session': sessionID}, function(err, doc) {
    if(err){ throw err; }
    callback(doc);
  });
}


//
// app.post('/ai', (req, res)=>{
//     console.log('*** Webhook for api.ai query ***');
//     console.log(req.body.result)
//     if(req.body.result.action === 'artist'){
//         //call music artist api
//         let artist = req.body.result.paramters['artist'];
//         let baseUrl = "http://api.music-story.com/artist/search";
//         let msg = 'ACTION RESPONSE';
//         return res.json({
//             speech: msg,
//             displayText: msg,
//             source: 'artist'
//         });
//         // request.get('http://api.music-story.com/artist/search',{
//         //     oauth:{
//         //         consumer_key: process.env.CONSUMER_KEY,
//         //         consumer_secret: process.env.CONSUMER_SECRET,
//         //         token: process.env.ACCESS_TOKEN,
//         //         token_secret: process.env.TOKEN_SECRET
//         //     },
//         //     qs:{name: artist},
//         //     json: true
//         // }, function(error,res,body){
//         //     if(!error && res.statusCode == 200){
//         //         let jsonObj = JSON.parse(body);
//         //         let artist_id = jsonObj.id;
//         //         let msg = 'Artist id is ' + artist_id;
//         //
//         //         return res.json({
//         //             speech: msg,
//         //             displayText:msg,
//         //             source: 'artist'
//         //         });
//         //
//         //     }else{
//         //         return res.status(400).json({
//         //             status: {
//         //                 code: 400,
//         //                 errorType: 'Failed to look up artist name'
//         //             }
//         //         });
//         //     }
//         // })
//     }
// });
//
//
//
//
// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });
//
// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
