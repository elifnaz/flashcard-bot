# Flashcard Bot for Messenger
#### Built with Node.js, API.AI for NLP and MongoDB
<br>
EloBot can make small talk thanks to Google's Api.ai, and add flash cards to the database.
<br>
<br>
Each users's Messenger sessionID is stored in MongoDB so that they can access their cards later to practice. In the screenshot, you can see that there are 2 documents in the collection representing 2 different users and their cards array.
<br>
<br>
<br>

| [![](http://i.imgur.com/c0VzMMa.png)]() | [![](http://i.imgur.com/5ci5tDi.png)]() |
|:---:|:---:|
| small talk + adding cards | database |

<br>


### TODOS:

- [x] set up ngrok
- [x] verify Facebook webhook using ngrok
- [x] create an API.AI agent
- [ ] add quick reply option to the bot: https://developers.facebook.com/docs/messenger-platform/send-api-reference/quick-replies
- [x] host mongoDB on mLab
- [x] configure mongoose and get rid of the deprecation warning for open()
- [ ] customize API.AI small talk
- [x] create a Card Intent for the API.AI agent
- [x] create a Practice Intent for the API.AI agent
- [ ] create process.env file for Node
- [ ] deploy on AWS
