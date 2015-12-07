/* update user, json return users-put */var config = require('arp-config');var utils = require('arp-utils');var lists = require('arp-lists');var db = require('arp-data');// librariesvar aws = require('aws-sdk');var jwt = require('jwt-simple');var dynamo = require('dynamo-client');dynamo.Request.prototype.maxRetries = 10;var dynamodb = dynamo.createClient(config.aws.region, {    secretAccessKey: config.aws.secretAccessKey,    accessKeyId: config.aws.accessKeyId});// initializer of 'class'exports.handler = function(event, context) {    context = utils.customizeContext(context);    console.log("u " + event.username);    //console.log("t " + event.token);    //console.log("p " + event.post);    /*     * RUNS FROM authenticate     */    var action = function(){        try {            var attrs = {};            if (event.post.fname) {                attrs.fname = event.post.fname;            }            if (event.post.lname) {                attrs.lname = event.post.lname;            }            if (event.post.password) {                attrs.password = event.post.password;            }            if (event.post.role) {                attrs.role = event.post.role;            }            // setup attrs to update            if (!attrs || attrs.length < 1) {                context.fail("Bad Request: At least one field must be updated.");            }            else {                // required params                var params = {                    TableName: 'Users',                    ReturnValues: "ALL_NEW"                };                params.ExpressionAttributeNames = {};                params.ExpressionAttributeValues = {};                var tmpexp = [];                if (attrs.fname) {                    if (attrs.fname.length < 1) {                        context.fail("Bad Request: The first name cannot be blank.");                    }                    else {                        params.ExpressionAttributeNames["#f"] = "fname";                        params.ExpressionAttributeValues[":f"] = {"S": attrs.fname};                        tmpexp.push("#f = :f");                    }                }                if (attrs.lname) {                    if (attrs.lname.length < 1) {                        context.fail("Bad Request: The last name cannot be blank.");                    }                    else {                        params.ExpressionAttributeNames["#l"] = "lname";                        params.ExpressionAttributeValues[":l"] = {"S": attrs.lname};                        tmpexp.push("#l = :l");                    }                }                if (attrs.role) {                    if (lists.userRoles.indexOf(attrs.role) < 0) {                        context.fail("Bad Request: The submitted role appears invalid (" + attrs.role+").");                    }                    else{                        params.ExpressionAttributeNames["#r"] = "role";                        params.ExpressionAttributeValues[":r"] = {"S": attrs.role};                        tmpexp.push("#r = :r");                    }                }                if (attrs.password) {                    if (attrs.password.length >= 5) {                        params.ExpressionAttributeNames["#p"] = "password";                        params.ExpressionAttributeValues[":p"] = {"S": attrs.password};                        tmpexp.push("#p = :p");                    }                    else {                        context.fail("Bad Request: The new password appears invalid (minimum 5 characters).");                    }                }                if (event.username && event.username.length > 5) {  // todo validate for email                    params.Key = {                        "username": {                            "S": event.username                        }                    };                    params.ExpressionAttributeValues[":u"] = {"S": event.username};                    params.ConditionExpression = "username = :u";                    if (tmpexp.length < 1 || params.ExpressionAttributeValues.length < 1) {                        context.fail("Bad Request: At least one field must be updated.");                    }                    else {                        params.UpdateExpression = "SET " + tmpexp.join(",");                    }                }                else {                    context.fail("Bad Request: The username/id to update appears invalid.");                }                dynamodb.request('UpdateItem', params, function (err, data) {                    if (!err) {                        var usr = {};                        usr.username = data.Attributes.username.S;                        usr.fname = data.Attributes.fname.S;                        usr.lname = data.Attributes.lname.S;                        usr.role = data.Attributes.role.S;                        usr.password = data.Attributes.password.S;                        context.succeed(usr);                    }                    else {                        console.log(err.message);                        if (err.name == "ConditionalCheckFailedException") {                            err.message = "The username/email to update cannot be found."                        }                        context.fail("Bad Request: The username/email to update cannot be found.");                    }                });            }        }        catch(err){            console.log(err.message);            context.fail("Internal Error: " + err.message);        }    };    db.Users.authenticate(event.token, "admin", function(err, authenticated){        try {            if(authenticated === true) {                action();            }            else{                context.fail(err);            }        }        catch(e){            context.fail("Internal Error: " + e.message);        }    });};