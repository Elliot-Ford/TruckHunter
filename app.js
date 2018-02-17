var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


// This code is called only when subscribing the webhook //
app.get('/webhook/', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === 'BIGTOKEN') {
  console.log("Validating webhook");
  res.status(200).send(req.query['hub.challenge']);
} else {
  console.error("Failed validation. Make sure the validation tokens match.");
  res.sendStatus(403);
}
});


  // Incoming messages reach this end point //
app.post('/webhook/', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
  // Iterate over each entry
  // There may be multiple if batched
  data.entry.forEach(function(pageEntry) {
    var pageID = pageEntry.id;
    var timeOfEvent = pageEntry.time;

    // Iterate over each messaging event
    pageEntry.messaging.forEach(function(messagingEvent) {
      if (messagingEvent.optin) {
        receivedAuthentication(messagingEvent);
      } else if (messagingEvent.message) {
        receivedMessage(messagingEvent);
      // } else if (messagingEvent.delivery) {
      //   receivedDeliveryConfirmation(messagingEvent);
      // } else if (messagingEvent.postback) {
      //   receivedPostback(messagingEvent);
      // } else if (messagingEvent.read) {
      //   receivedMessageRead(messagingEvent);
      // } else if (messagingEvent.account_linking) {
      //   receivedAccountLink(messagingEvent);
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
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
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
function receivedMessage(event) {
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
  switch (messageText.replace(/[^\w\s]/gi, '').trim().toLowerCase()) {
    default:
      sendTextMessage(senderID, messageText);
  }
} else if (messageAttachments) {
  sendTextMessage(senderID, "Message with attachment received");
}
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

var token = "BIGTOKEN";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);
console.log("started");
