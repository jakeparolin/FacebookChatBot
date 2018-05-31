const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

exports.userGreeting= function(sender_psid) {
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


exports.randomJoke = function(sender_psid) {
    let joke;
    let response;

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
