/*-----------------------------------------------------------------------------
To learn more about this template please visit
https://aka.ms/abs-node-proactive
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var azure = require('azure-storage');
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// Intercept trigger event (ActivityTypes.Trigger)
bot.on('trigger', function (message) {
    // handle message from trigger function
    var queuedMessage = message.value;
    var reply = new builder.Message()
        .address(queuedMessage.address)
        .text('This is coming from the trigger: ' + queuedMessage.text);
        
    bot.send(reply);
});

// Handle message from user



bot.dialog('/', function (session) {
    var queuedMessage = { address: session.message.address, text: session.message.text };
    // add message to queue
    session.sendTyping();
    var queueSvc = azure.createQueueService(process.env.AzureWebJobsStorage);
 

    queueSvc.createQueueIfNotExists('bot-queue', function(err, result, response){
        if(!err){
            // Add the message to the queue
            var queueMessageBuffer = new Buffer(JSON.stringify(queuedMessage)).toString('base64');
            queueSvc.createMessage('bot-queue', queueMessageBuffer, function(err, result, response){
                if(!err){
                    // Message inserted
                 //   session.send('Your message (\'' + session.message.text + '\') has been added to a queue, and it will be sent back to you via a Function');
                 // This is a dinner reservation bot that uses a waterfall technique to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Good day are you ready to track Patient's Vital Stats?");
        builder.Prompts.text(session, "Please provide Patient's ID: ");
    },
    function (session, results) {
        session.dialogData.PatID  = results.response;
        builder.Prompts.text(session, "Please provide Body Mass Index: ");    
    },
    function (session, results) {
        session.dialogData.BMI  = results.response;
        builder.Prompts.text(session, "Please provide B P Systolic: ");
    },
    function (session, results) {
        session.dialogData.BP1 = results.response;
        builder.Prompts.text(session, "Please provide B P Diastolic: ");
    },
    function (session, results) {
        session.dialogData.BP2 = results.response;
        builder.Prompts.text(session, "Please provide Pulse per/min: ");
    },
    function (session, results) {
        session.dialogData.Pulse = results.response;
        builder.Prompts.text(session, "Please provide Height: ");
    },
    function (session, results) {
        session.dialogData.Height = results.response;
        builder.Prompts.text(session, "Please provide Weight: ");
    },
    function (session, results) {
        session.dialogData.Weight = results.response;

        // Process request and display reservation details
        session.send("Data has been saved. Vital Stats details: <br/>Patient's ID: %s <br/>Body Mass Index: %s <br/>B P Systolic: %s <br/>B P Diastolic: %s <br/>Pulse per/min: %s <br/>Height: %s <br/>Weight: %s",
           session.dialogData.PatID, session.dialogData.BMI, session.dialogData.BP1, session.dialogData.BP2, session.dialogData.Pulse, session.dialogData.Height, session.dialogData.Weight);
        session.endDialog();
    }
]);
                } else {
                    // this should be a log for the dev, not a message to the user
                    session.send('There was an error inserting your message into queue');
                }
            });
        } else {
            // this should be a log for the dev, not a message to the user
            session.send('There was an error creating your queue');
        }
    });

});

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}


