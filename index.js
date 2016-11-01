'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const firebase = require("firebase")
const token = process.env.FB_PAGE_ACCESS_TOKEN

/*
* Payload for generic messages
*/

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

firebase.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL
})
app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.get('/', function (req, res) {
    res.send('Hello folks, I am a tracker bot who tracks your tasks.')
})
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
      let event = req.body.entry[0].messaging[i]
      let sender = event.sender.id
      if (event.message && event.message.text) {
        let text = event.message.text
        if(text.startsWith("add:")) {
            if(text.endsWith("-today")) {
              sendTextMessage(sender,"add-today")
            }
            else if(text.endsWith("-tomorrow")) {
              sendTextMessage(sender,"add-tomorrow");
            }else {
              sendTextMessage(sender,text)
            }
        } else if (text.startsWith("view:")) {
            if(text.indexOf("view:today")  != -1 ) {
              sendTextMessage(sender,"view:today")
            } else if(text.indexOf("view:upcoming")  != -1 ) {
              sendTextMessage(sender,"view:upcoming")
            } else if(text.indexOf("view:completed") != -1 ) {
              sendTextMessage(sender,"view:completed")
            } else {
              sendTextMessage(sender,text)
            }
        }
        else if (text.startsWith("del:")) {
          if(text.indexOf("del:all") != -1) {
            sendTextMessage(sender,"del:all")
          } else if(text.indexOf("del") != -1) {
            sendTextMessage(sender,"del")
          } else {
            sendTextMessage(sender,token)
          }
        }
        else {
          sendTextMessage(sender,text)
          sendGenericMessage(sender,0)
          continue
        }
      }

      if (event.postback) {
        let text = JSON.stringify(event.postback)
        let payload = event.postback.payload
          if(payload == "create_task") {
            sendTextMessage(sender, "To add a task, message in below format.\nadd:description-dd/mm/yyy\nadd:description-today\nadd:description-tomorrow") //\nFor more commands type : help -add
          } else if(payload == "view_task") {
            sendTextMessage(sender, "To view a task, message in below format.\n'view:today' - Display Todays task\n'view:upcoming' - Display Upcoming Task\n'view:completed' - Display Completed Tasks") //\nFor more commands type : help -view
          } else if(payload == "delete_task") {
            sendTextMessage(sender, "To delete a task, message in below format.\n'del:all ' - To delete all tasks\n'del:dd/mm/yyy dd/mm/yyy' - To delete tasks between two range\n'del:dd/mm/yyyy hh:mm' - To delete specific task in particular time")//\nFor more commands type : help -del
          }
          continue
      }

    }
    res.sendStatus(200)
  })

/*
* Function for sending normal text messages
*/

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

/*
* Function for sending generic text messages
*/

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

function saveToFirebase(mode, text, datetime){

}

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
