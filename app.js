/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
'use strict';

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request');

var app = express();

app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

var state = 0;

var trucks = {
  '0':{
    "_id": "0",
    "truck_name": "Brown Food Truck",
    "coordinate" : {
      "lat": 43.66048866,
      "long": -79.39713007
    },
    "discount": "None",
    "url": "http://example.com"
  },
'1':{
    "_id": "1",
    "truck_name": "Yellow Food Truck",
    "coordinate" : {
      "lat": 43.65698027,
      "long": -79.39547782
    },
    "discount": "None",
    "url": "http://example.com"
  },
'2':{
    "_id": "2",
    "truck_name": "Blue Food Truck",
    "coordinate" : {
      "lat": 43.66059733,
      "long": -79.40140014
    },
    "discount": "None",
    "url": "http://example.com"
  },
'3':{
    "_id": "3",
    "truck_name": "Green Food Truck",
    "coordinate" : {
      "lat": 43.65802039,
      "long": -79.39547782
    },
    "discount": "None",
    "url": "http://example.com"
    }
  '4':{
      "_id": "4",
      "truck_name": "Black Food Truck",
      "coordinate" : {
        "lat": 43.6630655,
        "long": -79.39805275
      },
      "discount": "None",
      "url": "http://example.com"
      }
  '5':{
    "_id": "5",
    "truck_name": "Black Food Truck",
    "coordinate" : {
        "lat": 43.66512035,
        "long": -79.41064433
    },
    "discount": "None",
    "url": "http://example.com"
    }
  '6':{
    "_id": "6",
    "truck_name": "Black Food Truck",
    "coordinate" : {
        "lat": 43.66865931,
        "long": -79.39313487
    },
    "discount": "None",
    "url": "http://example.com"
    }
  '7':{
    "_id": "7",
    "truck_name": "Black Food Truck",
    "coordinate" : {
        "lat": 43.66536871,
        "long": -79.38772754
    },
    "discount": "None",
    "url": "http://example.com"
    }
  '8':{
    "_id": "8",
    "truck_name": "Black Food Truck",
    "coordinate" : {
        "lat": 43.66064979,
        "long": -79.38562468
    },
    "discount": "None",
    "url": "http://example.com"
    }
  '9':{
    "_id": "9",
    "truck_name": "Black Food Truck",
    "coordinate" : {
        "lat": 43.67124337,
        "long": -79.3893154
    },
    "discount": "None",
    "url": "http://example.com"
    }
  }
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}


/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
 var data = req.body;

 // Make sure this is a page subscription
 if (data.object == 'page') {
   // Iterate over each entry
   // There may be multiple if batched

   data.entry.forEach(function (pageEntry) {
     var pageID = pageEntry.id;
     var timeOfEvent = pageEntry.time;

   // // Gets the body of the webhook event
   // let webhook_event = entry.messaging[0];
   // console.log(webhook_event);
   //
   // // Get the sender PSID
   // let sender_psid = webhook_event.sender.id;
   // console.log('Sender PSID: ' + sender_psid);

     // Iterate over each messaging event
     pageEntry.messaging.forEach(function (messagingEvent) {
       if (messagingEvent.optin) {
         receivedAuthentication(messagingEvent);
       } else if (messagingEvent.message) {
         receivedMessage(messagingEvent);
       } else if (messagingEvent.delivery) {
         receivedDeliveryConfirmation(messagingEvent);
       } else if (messagingEvent.postback) {
         receivedPostback(messagingEvent);
       } else if (messagingEvent.read) {
         receivedMessageRead(messagingEvent);
       } else if (messagingEvent.account_linking) {
         receivedAccountLink(messagingEvent);
       } else {
         console.log("Webhook received unknown messagingEvent: ", messagingEvent);
       }
     });
   });

   // Assume all went well.
   //
   // You must send back a 200, within 20 seconds, to let us know you've
   // successfully received the callback. Otherwise, the request will time out.
   res.sendStatus(200);
 }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication (event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage (event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s",
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);

    sendTextMessage(senderID, "Quick reply tapped");
    return;
  }

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText.replace(/[^\w\s\d]/gi, '').trim().toLowerCase()) {
      case 'hello':
      case 'hi':
        sendHiMessage(senderID);
        break;

      case '1':
      if(state === '1') {
        sendLocationMessage(senderID, 1);
      } else {
        sendUnknownMessage(senderID);
      }
      break;
      case '2':
      if(state === '1') {
        sendLocationMessage(senderID, 2);
      } else {
        sendUnknownMessage(senderID);
      }
      break;
      case '3':
      if(state === '1') {
        sendLocationMessage(senderID, 3);
      } else {
        sendUnknownMessage(senderID);
      }
      break;
      case '4':
      if(state === '1') {
        sendLocationMessage(senderID, 4);
      } else {
        sendUnknownMessage(senderID);
      }
      break;
      case '5':
      if(state === '1') {
        sendLocationMessage(senderID, 5);
      } else {
        sendUnknownMessage(senderID);
      }
      break;
      case '6':
      if(state === '1') {
        sendLocationMessage(senderID, 6);
      } else {
        sendUnknownMessage(senderID);
      }
      break;
      case '7':
      if(state === '1') {
        sendLocationMessage(senderID, 7);
      } else {
        sendUnknownMessage(senderID);
      }
      break;
      case '8':
      if(state === '1') {
        sendLocationMessage(senderID, 8);
      } else {
        sendUnknownMessage(senderID);
      }
      break;
      case '9':
        if(state === '1') {
          sendLocationMessage(senderID, 9);
        } else {
          sendUnknownMessage(senderID);
        }
        break;

      case 'start hunt':
        sendQuickReply(senderID);
        break;

      default:
        sendUnknownMessage(senderID);
    }
  } else if (messageAttachments) {
    if(messageAttachments.type === "location") {
      sendLocationMessage();
      sendTrucksMessage(senderID);
    }
  }
}

function sendTrucksMessage(recipientId) {
  var ret = "";
  forEach(truck in trucks) {
    ret += "{0}: {1}".format(truck,truck.truck_name);
  }
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: ret,
    }
  }
  callSendAPI(messageData);
}

function sendLocationMessage(recipientId, truck_id) {
  var lat = trucks.getJSONArray(truck_id).coordinate.lat;
  var long = trucks.getJSONArray(truck_id).coordinate.long;
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements:[{
            title:"Here's your food truck! :)",
            image_url: "https://maps.googleapis.com/maps/api/staticmap?center="
            + lat + "," + long + "&zoom=15&size=600x300&maptype=roadmap&markers=color:blue%7Clabel:S%7C"
            + lat + "," + long + "&key=AIzaSyB6vp4DRwF2xSUVdOefzuVkncvc7kDMyo8",
            default_action: {
              type: "web_url",
              url: "https://www.google.ca/maps/place/" + lat + "," + long + "/@" + lat + "," + long + ",17z/data=!4m5!3m4!1s0x0:0x0!8m2!3d" + lat + "!4d" + long
            }
          }]
        }
      }
    }
  };
  state = 2;
  callSendAPI(messageData);
}

function sendUnknownMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: `Unfortunatly I'm not that smart (yet).`
    }
  }

  callSendAPI(messageData);
}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation (event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function (messageID) {
      console.log("Received delivery confirmation for message ID: %s",
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback (event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead (event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink (event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

function sendHiMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: `
Hi I'm Food Truck Hunter! A game that allows you to find food trucks!

If you want to play then tell me "Start Hunt"!
      `
    }
  }

  callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Location please!",
      quick_replies: [
        {
          "content_type":"location",
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s",
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

// ***********************************//
/**
 * Module dependencies.
 */

var
    path = require('path'),
    fs = require('fs');

var db_food_truck;

var db_user;

var cloudant_food_truck;

var cloudant_user;

var fileToUpload;

var dbCredentialsFoodTruck = {
    dbFoodTruck: 'food_truck_db',
};

var dbCredentialsUsers = {
    dbName: 'users_db'
};

var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

// // development only
// if ('development' == app.get('env')) {
//     app.use(errorHandler());
// }

function getdbCredentialsUrl(jsonData) {
    var vcapServices = JSON.parse(jsonData);
    // Pattern match to find the first instance of a Cloudant service in
    // VCAP_SERVICES. If you know your service key, you can access the
    // service credentials directly by using the vcapServices object.
    for (var vcapService in vcapServices) {
        if (vcapService.match(/cloudant/i)) {
            return vcapServices[vcapService][0].credentials.url;
        }
    }
}

function initDBConnection() {
    //When running on Bluemix, this variable will be set to a json object
    //containing all the service credentials of all the bound services
    if (process.env.VCAP_SERVICES) {
        dbCredentialsFoodTruck.url = getdbCredentialsUrl(process.env.VCAP_SERVICES);
        dbCredentialsUsers.url = getdbCredentialsUrl(process.env.VCAP_SERVICES);
    } else { //When running locally, the VCAP_SERVICES will not be set

        // When running this app locally you can get your Cloudant credentials
        // from Bluemix (VCAP_SERVICES in "cf env" output or the Environment
        // Variables section for an app in the Bluemix console dashboard).
        // Once you have the credentials, paste them into a file called vcap-local.json.
        // Alternately you could point to a local database here instead of a
        // Bluemix service.
        // url will be in this format: https://username:password@xxxxxxxxx-bluemix.cloudant.com
        dbCredentialsFoodTruck.url = getdbCredentialsUrl(fs.readFileSync("vcap-local.json", "utf-8"));
        dbCredentialsUsers.url = getdbCredentialsUrl(fs.readFileSync("vcap-local.json", "utf-8"));
    }

    cloudant_food_truck = require('cloudant')(dbCredentialsFoodTruck.url);
    cloudant_user = require('cloudant')(dbCredentialsUsers.url);

    // check if DB exists if not create
    cloudant_food_truck.db_food_truck.create(dbCredentialsFoodTruck.dbName, function(err, res) {
        if (err) {
            console.log('Could not create new db: ' + dbCredentialsFoodTruck.dbName + ', it might already exist.');
        }
    });

    cloudant_user.db_user.create(dbCredentialsUsers.dbName, function(err, res) {
        if (err) {
            console.log('Could not create new db: ' + dbCredentialsUsers.dbName + ', it might already exist.');
        }
    });

    db_food_truck = cloudant_food_truck.use(dbCredentialsFoodTruck.dbName);

    db_user = cloudant_user.use(dbCredentialsUser.dbName);
}

initDBConnection();

function createFoodTruckDB(id, truck_name, lat, long, discount, url) {

    var responseData = {
        id: id,
        truck_name: sanitizeInput(truck_name),
        lat: sanitizeInput(lat),
        long: sanitizeInput(long),
        discount: sanitizeInput(discout),
        url: sanitizeInput(url)
      };

      return responseData;
  }

function sanitizeInput(str) {
    return String(str).replace(/&(?!amp;|lt;|gt;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var saveFoodTruck = function(id, truck_name, lat, long, discount, url, response) {

    if (id === undefined) {
        // Generated random id
        id = '';
    }

    db_food_truck.insert({
        truck_name: truck_name,
        lat: lat,
        long: long,
        discout: discount,
        url: url
    }, id, function(err, doc) {
        if (err) {
            console.log(err);
            response.sendStatus(500);
        } else
            response.sendStatus(200);
        response.end();
    });

}

app.post('/api/foodtruck', function(request, response) {

    console.log("Create Invoked..");
    console.log("Truck Name: " + request.body.truck_name);
    console.log("Latitude: " + request.body.lat);
    console.log("Longitude: " + request.body.long);
    console.log("Discount: " + request.body.discount);
    console.log("URL: " + request.body.url);

    // var id = request.body.id;
    var truck_name = sanitizeInput(request.body.truck_name);
    var lat = sanitizeInput(request.body.lat);
    var long = sanitizeInput(request.body.long);
    var discount = sanitizeInput(request.body.discout);
    var url = sanitizeInput(request.body.url);

    saveFoodTruck = function(id, truck_name, lat, long, discount, url, response);

});

app.delete('/api/foodtruck', function(request, response) {

    console.log("Delete Invoked..");
    var id = request.query.id;
    // var rev = request.query.rev; // Rev can be fetched from request. if
    // needed, send the rev from client
    console.log("Removing document of ID: " + id);
    console.log('Request Query: ' + JSON.stringify(request.query));

    db_food_truck.get(id, {
        revs_info: true
    }, function(err, doc) {
        if (!err) {
            db_food_truck.destroy(doc._id, doc._rev, function(err, res) {
                // Handle response
                if (err) {
                    console.log(err);
                    response.sendStatus(500);
                } else {
                    response.sendStatus(200);
                }
            });
        }
    });

});

app.put('/api/foodtruck', function(request, response) {

    console.log("Update Invoked..");

    var id = request.body.id;
    var truck_name = sanitizeInput(request.body.truck_name);
    var lat = sanitizeInput(request.body.lat);
    var long = sanitizeInput(request.body.long);
    var discount = sanitizeInput(request.body.discout);
    var url = sanitizeInput(request.body.url);

    console.log("ID: " + id);

    db_food_truck.get(id, {
        revs_info: true
    }, function(err, doc) {
        if (!err) {
            console.log(doc);
            var truck_name = sanitizeInput(request.body.truck_name);
            var lat = sanitizeInput(request.body.lat);
            var long = sanitizeInput(request.body.long);
            var discount = sanitizeInput(request.body.discout);
            var url = sanitizeInput(request.body.url);
            db_food_truck.insert(doc, doc.id, function(err, doc) {
                if (err) {
                    console.log('Error inserting data\n' + err);
                    return 500;
                }
                return 200;
            });
        }
    });
});

app.get('/api/foodtruck', function(request, response) {

    console.log("Get method invoked.. ")

    db_food_truck = cloudant_food_truck.use(dbCredentialsFoodTruck.dbName);
    var docList = [];
    var i = 0;
    db_food_truck.list(function(err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of docs -> ' + len);
            if (len == 0) {
                // push sample data
                // save doc
                var doc_truck_name = sanitizeInput(request.body.truck_name);
                var doc_lat = sanitizeInput(request.body.lat);
                var doc_long = sanitizeInput(request.body.long);
                var doc_discount = sanitizeInput(request.body.discout);
                var doc_url = sanitizeInput(request.body.url);

                db_food_truck.insert({
                    truck_name: doc_truck_name,
                    lat: doc_lat,
                    long: doc_long,
                    discount: doc_discount,
                    url: doc_url
                }, '', function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Document : ' + JSON.stringify(doc));
                        var responseData = createFoodTruckDB(
                            doc.id,
                            doc_truck_name,
                            doc_lat,
                            doc_long,
                            doc_discount,
                            doc_url);
                        docList.push(responseData);
                        response.write(JSON.stringify(docList));
                        console.log(JSON.stringify(docList));
                        console.log('ending response...');
                        response.end();
                    }
                });
            } else {

                body.rows.forEach(function(document) {

                    db_food_truck.get(document.id, {
                        revs_info: true
                    }, function(err, doc) {
                        if (!err) {
                              var responseData = createFoodTruckDB(
                                  doc._id,
                                  doc.truck_name,
                                  doc.lat,
                                  doc.long,
                                  doc.discount,
                                  doc.url);
                            docList.push(responseData);
                            i++;
                            if (i >= len) {
                                response.write(JSON.stringify(docList));
                                console.log('ending response...');
                                response.end();
                            }
                        } else {
                            console.log(err);
                        }
                    });

                });
            }

        } else {
            console.log(err);
        }
    });

});


function createUser(id, name, lat, long, state, points) {

    var responseData = {
        id: id,
        name: sanitizeInput(name),
        lat: sanitizeInput(lat),
        long: sanitizeInput(long),
        state: sanitizeInput(state),
        points: sanitizeInput(points)
      };

      return responseData;
  }

var saveUser = function(id, name, lat, long, state, points, response) {

    if (id === undefined) {
        // Generated random id
        id = '';
    }

    db_user.insert({
        name: name,
        lat: lat,
        long: long,
        state: state,
        points: points
    }, id, function(err, doc) {
        if (err) {
            console.log(err);
            response.sendStatus(500);
        } else
            response.sendStatus(200);
        response.end();
    });

}

app.post('/api/user', function(request, response) {

    // var id = request.body.id;
    var name = sanitizeInput(request.body.name);
    var lat = sanitizeInput(request.body.lat);
    var long = sanitizeInput(request.body.long);
    var state = sanitizeInput(request.body.state);
    var points = sanitizeInput(request.body.points);

    saveUser = function(id, name, lat, long, state, points, response)

});

app.delete('/api/user', function(request, response) {

    console.log("Delete Invoked..");
    var id = request.query.id;
    // var rev = request.query.rev; // Rev can be fetched from request. if
    // needed, send the rev from client
    console.log("Removing document of ID: " + id);
    console.log('Request Query: ' + JSON.stringify(request.query));

    db_user.get(id, {
        revs_info: true
    }, function(err, doc) {
        if (!err) {
            db_user.destroy(doc._id, doc._rev, function(err, res) {
                // Handle response
                if (err) {
                    console.log(err);
                    response.sendStatus(500);
                } else {
                    response.sendStatus(200);
                }
            });
        }
    });

});

app.put('/api/user', function(request, response) {

    console.log("Update Invoked..");

    var id = request.body.id;
    var name = sanitizeInput(request.body.name);
    var lat = sanitizeInput(request.body.lat);
    var long = sanitizeInput(request.body.long);
    var state = sanitizeInput(request.body.state);
    var points = sanitizeInput(request.body.points);

    console.log("ID: " + id);

    db_user.get(id, {
        revs_info: true
    }, function(err, doc) {
        if (!err) {
            console.log(doc);
            var name = sanitizeInput(request.body.name);
            var lat = sanitizeInput(request.body.lat);
            var long = sanitizeInput(request.body.long);
            var state = sanitizeInput(request.body.state);
            var points = sanitizeInput(request.body.points);
            db_user.insert(doc, doc.id, function(err, doc) {
                if (err) {
                    console.log('Error inserting data\n' + err);
                    return 500;
                }
                return 200;
            });
        }
    });
});

app.get('/api/user', function(request, response) {

    console.log("Get method invoked.. ")

    db = cloudant_user.use(dbCredentialsUser.dbName);
    var docList = [];
    var i = 0;
    db_user.list(function(err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of docs -> ' + len);
            if (len == 0) {
                // push sample data
                // save doc
                var doc_name = sanitizeInput(request.body.name);
                var doc_lat = sanitizeInput(request.body.lat);
                var doc_long = sanitizeInput(request.body.long);
                var doc_state = sanitizeInput(request.body.state);
                var doc_points = sanitizeInput(request.body.points);

                db_user.insert({
                    name: doc_name,
                    lat: doc_lat,
                    long: doc_long,
                    state: doc_state,
                    points: doc_points
                }, '', function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Document : ' + JSON.stringify(doc));
                        var responseData = createUser(
                            doc.id,
                            doc_name,
                            doc_lat,
                            doc_long,
                            doc_state,
                            doc_points);
                        docList.push(responseData);
                        response.write(JSON.stringify(docList));
                        console.log(JSON.stringify(docList));
                        console.log('ending response...');
                        response.end();
                    }
                });
            } else {

                body.rows.forEach(function(document) {

                    db_user.get(document.id, {
                        revs_info: true
                    }, function(err, doc) {
                        if (!err) {
                              var responseData = createUser(
                                  doc._id,
                                  doc.name,
                                  doc.lat,
                                  doc.long,
                                  doc.state,
                                  doc.points);
                            docList.push(responseData);
                            i++;
                            if (i >= len) {
                                response.write(JSON.stringify(docList));
                                console.log('ending response...');
                                response.end();
                            }
                        } else {
                            console.log(err);
                        }
                    });

                });
            }

        } else {
            console.log(err);
        }
    });

});
