var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


// This code is called only when subscribing the webhook //
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'mySecretAccessToken') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
})


// Incoming messages reach this end point //
app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text;
// Calling the Weather App. Change the address below to the url of your Weather app. Response is sent back to the user via the sendMessage function //
            request("https://whatistheweather.mybluemix.net/getWeather?text=" + text, function (error, response, body) {
                sendMessage(sender, body);
            });
        }
    }
    res.sendStatus(200);
});


// This function receives the response text and sends it back to the user //
function sendMessage(sender,text) {
    messageData = {
        text: text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

var token = "Replace with the access token from Facebook";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);
