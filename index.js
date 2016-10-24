'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const firebase = require("firebase")
const token = process.env.FB_PAGE_ACCESS_TOKEN
app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.get('/', function (req, res) {
    res.send('Hello folks, I am a tracker bot who tracks your tasks.')
})
firebase.initializeApp({
  serviceAccount: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_MAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  },
  databaseURL: process.env.FIREBASE_DATABASE_URL
});


app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let db = firebase.database();
            let ref = db.ref("server/saving-data/fireblog");
            var usersRef = ref.child("users");
            usersRef.set({
              alanisawesome: {
                date_of_birth: "June 23, 1912",
                full_name: "Alan Turing"
              },
              gracehop: {
                date_of_birth: "December 9, 1906",
                full_name: "Grace Hopper"
              }
            }, function(error) {
                if (error) {
                  console.log("Data could not be saved." + error);
                } else {
                  console.log("Data saved successfully.");
                }
              });
            let text = event.message.text
            sendTextMessage(sender, "I am you: " + text.substring(0, 200))
        }
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
