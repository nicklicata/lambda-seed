

var fs = require('fs');
var config = require('custom-config');
var path = require('path');
var _ = require('underscore');

var AWS = require('aws-sdk');
AWS.config = {
    "accessKeyId": config.aws.accessKeyId,
    "secretAccessKey": config.aws.secretAccessKey,
    "region": config.aws.region
};

var s3 = new AWS.S3();

var ncp = require('ncp').ncp;
ncp.limit = 8;

var total = config.functions.length;
var processed = 0;
var errors = [];

process.argv.forEach(function (val, index, array) {
    if(val.indexOf("functions=")==0){
        config.functions = val.split("=")[1].split(",");
    }
});

_.each(config.functions, function(fname){

    fs.stat(__dirname + "/" + fname + "/", function(statErr, stats) {

        if (!statErr && stats.isDirectory() === true){
            var exec = require('child_process').exec, child, child2;
            console.log("working: " + fname);

            // delete existing node_modules
            console.log("deleting node modules: " + fname);
            child = exec('rm -rf ./' + fname + '/node_modules/', function (e, out) {

                if (!e) {
                    console.log("deleting zip files: " + fname);

                    // delete existing archive
                    child = exec('rm -rf ./' + fname + '*//*.zip', function (er, out) {

                        // copy node modules to all
                        // function directories
                        if (!er) {

                            console.log("copying new node_modules: " + fname);

                            ncp("node_modules", "" + fname + "/node_modules/", {stopOnErr: false}, function (err) {

                                if (err) {
                                    errors.push(err);
                                    console.log("ERROR! - " + fname + ": " + err);
                                }
                                else {

                                    console.log("creating zip archive: " + fname);
                                    var archiver = require('archiver');
                                    var outputPath = __dirname + "/" + fname + "/" + fname + ".zip";

                                    var output = fs.createWriteStream(outputPath);
                                    var zip = archiver('zip');

                                    output.on('close', function () {
                                        console.log('done with the zip: ' + fname);
                                    });

                                    output.on('finish', function () {

                                        console.log("reading: " + fname + ".zip");

                                        fs.readFile(__dirname + "/" + fname + "/" + fname + ".zip", function (erro, fdata) {

                                            if (erro) {
                                                errors.push(erro);
                                                console.log(fname + ": " + erro);
                                            }
                                            else {
                                                console.log("uploading: " + fname + ".zip");

                                                var params = {
                                                    Bucket: config.aws.s3Functionbucket,
                                                    Key: fname + '.zip',
                                                    ACL: "public-read",
                                                    Body: fdata
                                                };
                                                s3.putObject(params, function (error, data) {
                                                    if (error) {
                                                        errors.push(error);
                                                        console.log(fname + ": " + error);
                                                    }
                                                    else {
                                                        //console.log(data);           // successful response
                                                        console.log("updating function: " + fname);

                                                        // import to LAMBDA
                                                        var lambda = new AWS.Lambda();
                                                        var params = {
                                                            FunctionName: fname,
                                                            Publish: true,
                                                            S3Bucket: config.aws.s3Functionbucket,
                                                            S3Key: fname + '.zip'
                                                        };
                                                        lambda.updateFunctionCode(params, function (erra, data) {
                                                            processed += 1;
                                                            if (erra) {
                                                                errors.push(erra);
                                                                console.log(fname + ": " + erra);
                                                            } // an error occurred
                                                            else {
                                                                //console.log(data);           // successful response
                                                                console.log("FINISHED " + fname + "!");
                                                            }

                                                            if (processed >= total) {
                                                                console.log("Full Complete");
                                                                if (errors.length > 0) {
                                                                    console.log("errors:", errors);
                                                                }
                                                                else {
                                                                    console.log("no errors");
                                                                }
                                                            }
                                                        });
                                                    }
                                                });
                                            }

                                        });
                                    });

                                    zip.pipe(output);

                                    zip.bulk([
                                        {src: ["node_modules*//**"], expand: true, cwd: __dirname + "/" + fname + "/"},
                                        {src: ["*.js"], expand: true, flatten: true, cwd: __dirname + "/" + fname + "/"}
                                    ]);

                                    zip.finalize(function (erro, bytes) {
                                        if (erro) {
                                            console.log(erro);
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            errors.push(er);
                            console.log(er)
                        }
                    });
                }
                else {
                    errors.push(e);
                    console.log(e)
                }
            });

        }
        else{
            console.log("no such folder: " + fname);
            errors.push("no such folder: " + fname);
        }

    });



});