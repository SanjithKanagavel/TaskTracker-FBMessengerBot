'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const firebase = require("firebase")
const token = process.env.FB_PAGE_ACCESS_TOKEN

let generalMessage = {
    "attachment": {
        "type": "template",
        "payload": {
            "template_type": "generic",
            "elements": [{
                "title": "Create your task",
                "subtitle": "Creating task is simple",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/4/47/Press_button_Wikimedia_CH.svg",
                "buttons": [{
                    "type": "postback",
                    "title": "Create Task",
                    "payload": "create_task",
                }],
            }, {
                "title": "View Tasks",
                "subtitle": "View your task",
                "image_url": "http://www.pd4pic.com/images/icon-folder-open-button-documents-document.png",
                "buttons": [{
                    "type": "postback",
                    "title": "View Task",
                    "payload": "view_task",
                }],
            },{
                "title": "Delete Task",
                "subtitle": "Delete your task",
                "image_url": "http://blogs.cs.st-andrews.ac.uk/routing-island/files/2012/03/4-Delete.png",
                "buttons": [{
                    "type": "postback",
                    "title": "Delete Task",
                    "payload": "delete_task",
                }],
            }]
        }
    }
}

let createTask = {
    "attachment": {
        "type": "template",
        "payload": {
            "template_type": "generic",
            "elements": [{
                "title": "Task Details",
                "buttons": [{
                    "type": "postback",
                    "title": "Add Description",
                    "payload": "desc",
                },{
                    "type": "postback",
                    "title": "Add Date & Time",
                    "payload": "date_time",
                }],
            }]
        }
    }
}

let viewTask = {
    "attachment": {
        "type": "template",
        "payload": {
            "template_type": "generic",
            "elements": [{
                "title": "View Task",
                "buttons": [{
                    "type": "postback",
                    "title": "Today task",
                    "payload": "today_task",
                },{
                    "type": "postback",
                    "title": "Upcoming tasks",
                    "payload": "upcoming_task",
                },{
                    "type": "postback",
                    "title": "Recent tasks",
                    "payload": "recent_task",
                }],
            }]
        }
    }
}

app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.get('/', function (req, res) {
    res.send('Hello folks, I am a tracker bot who tracks your tasks.')
})

firebase.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

/*app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            let ts = event.timestamp
            console.log(req.body.entry);
            sendTextMessage(sender,text.substring(0, 200))
            firebase.database().ref('/Chats/'+sender+"/"+ts).set({
            "message" : text
            }, function(error) {
                if (error) {
                  console.log("Data could not be saved." + error);
                } else {
                  console.log("Data saved successfully.");
                }
              });
        }
    }
    res.sendStatus(200)
})*/
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {

      let event = req.body.entry[0].messaging[i]
      let sender = event.sender.id
      if (event.message && event.message.text) {
        let text = event.message.text
        if (text === 'Generic') {
            sendGenericMessage(sender,0)
            continue
        }
        sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
      }

      if (event.postback) {
        let text = JSON.stringify(event.postback)
        let payload = event.postback.payload
          if(payload == "create_task") {
            sendTextMessage(sender, "Great! Lets create them now. Type in the below format to create a task.", token)
            sendTextMessage(sender, "description-dd/mm/yyy\ndescription-today\ndescription-tomorrow\n", token)
            //sendGenericMessage(sender,1)
          } else if(payload == "view_task") {
            sendTextMessage(sender, "Great! Lets view them now.", token)
            sendGenericMessage(sender,2)
          } else if(payload == "delete_task") {
            sendTextMessage(sender, "Great! Lets view them now.", token)
            sendGenericMessage(sender,3)
          } else if(payload == "desc") {

          } else if(payload == "date_time") {

          } else if(payload == "today_task") {

          } else if(payload == "upcoming_task") {

          } else if(payload == "recent_task") {

          }
          continue
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
function sendGenericMessage(sender,index) {
  let messageData;
  if(index == 0) {
    messageData = generalMessage
  }
  else if(index == 1) {
    messageData = createTask
  }
  else if(index == 2){
    messageData = viewTask
  }
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
