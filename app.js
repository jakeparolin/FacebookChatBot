const express = require('express');
const bodyParser = require('body-parser');
const request = require ('request');
const app = express();

// Takes token from Heroku. CHANGE BACK FOR DEPLOYMENT
const VERIFY_TOKEN = process.env.TOKEN;
// Page Access Token
const PAGE_ACCESS_TOKEN = process.env.PAGE_TOKEN

var bodyObj = JSON.parse(body)

app.use(bodyParser.json())

// --Webhook--

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
});

app.post('/webhook', (req, res) => {  

    // Parse the request body from the POST
    let body = req.body;
  
    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {
      // Iterate over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
        // Gets the body of the webhook event
        let webhook_event = entry.messaging[0];
        console.log(webhook_event);
        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);
        // Checks received event and passes event to respected handler function
        if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);        
        } else if (webhook_event.postback) {
            handlePostback(sender_psid, webhook_event.postback);
        }
        
      });
  
      // Return a '200 OK' response to all events
      res.status(200).send('EVENT_RECEIVED');
  
    } else {
      // Return a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
  });

// --Handler Functions--

// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;
    //Check if the message contains text
    if (received_message.text) {
        let message = received_message.text.toLowerCase().trim();
   
        switch(message) {
            case "joke":
                randomJoke(sender_psid)
                break;

            case "weather": {
                getWeather(sender_psid)
            }
            
            case "help":
                response = {"text": "help"}
                break;

            default:
                response = {"text": "I'm sorry, I'm still learning and don't quite understand. type 'help' for a list of my commands"}
        }
    } else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;
    let payload = received_postback.payload

    if(payload) {
        switch (payload) {
            case 'Greeting':
                userGreeting(sender_psid)
                break;
            
            default:
                callSendAPI(sender_psid, response);
        }
    }
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
            if (!err) {
                console.log('message sent!')
            } else {
                console.log("Unable to send message:" + err);
            }
         }
    );
}

function userGreeting(sender_psid) {
    let name;
    let response;

    request({
        "uri": "https://graph.facebook.com/" + sender_psid,
        "qs": { 
            "access_token": PAGE_ACCESS_TOKEN,
            "fields": "first_name"
        },
        "method": "GET"
    }, (err, res, body) => {
            if (!err) {
                var bodyObj = JSON.parse(body);
                name = bodyObj.first_name;
                response = { "text": `Hello, ${name}. I am Dolores`}
                callSendAPI(sender_psid, response)
            } else {
                console.log("Unable to get name:" + err)
            }
    })
}

function randomJoke(sender_psid) {
    let response;
    let joke;

    request({
        "url": "https://icanhazdadjoke.com/",
        "headers": {
            "User-Agent": "https://parolin-chatbot.herokuapp.com/",
            "Accept": "application/json"
        },
        "method": "GET"
    }, (err, res, body) => {
        if(!err) {
            var bodyObj = JSON.parse(body);
            joke = bodyObj.joke;
            response = {"text": `${joke}`}
            callSendAPI (sender_psid, response)
        } else {
            console.log("Unable to get joke:" + err)
        }
    })
}

function getWeather(sender_psid) {
    let response;
    let temp;

    request({
        "url": "http://api.openweathermap.org/data/2.5/weather",
        "qs": {
            "id": "5391811",
            "units": "imperial",
            "appid": process.env.WEATHER
        },
        "method": "GET"
    }, (err, res, body) => {
        if(!err) {
            temp = bodyObj.main.temp  // Degrees in fahrenheit
            humidity = bodyObj.main.humidity //Humidity
            high = bodyObj.main.temp_max //High temp for the day
            low = bodyObj.main.temp_min // Low for the day
            wind = bodyObj.wind.speed // Wind Speeds
            name = bodyObj.name
            
            response = {"text": `Here is your weather update for ${name}. 
                                The current temperature is ${temp} degrees with a high of ${high} and a low of ${low}.
                                Humidty is at ${humidity}% with wind speeds at ${wind}mph`}
            callSendAPI (sender_psid, response)
        } else {
            console.log("Unable to get weather:" +err)
        }
    })
}

module.exports = app