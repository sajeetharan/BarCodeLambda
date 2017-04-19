var dstBucket = null;
var dstKey = null;
var srcFileKey = null;
var AWS = require('aws-sdk');
var fs = require('fs');
var s3 = new AWS.S3();
var jsQR = require("jsqr");
var jpeg = require("jpeg-js");
var local_stored_pdf = null;
var dbService = require('dbservice');
var infoModel = require(__dirname + '/model/UploadInfo');
var config = require('config');
var ticketResult = {};
var pageObject = {};

var uploadInfoObject = {};
var Processid;

function upload(bucket,ticketResult, sourceFile, key, filename, content_type, cb) {
        s3.putObject({
                Bucket: bucket,
                Key: key,
                Body: fs.createReadStream(filename),
                ContentType: content_type
        }, function (err, data) {
                console.log(err);
                cb(err, data);
        });
        var jpegData = fs.readFileSync(filename);
        var rawImageData = jpeg.decode(jpegData);
        var decode = jsQR.decodeQRFromImage(rawImageData.data, rawImageData.width, rawImageData.height);
        var Imagepath = '';
        Imagepath = bucket + "/" + key;       
        ticketResult.Ticketpages.push({
                Type: "e-ticket",
                Page: filename.split("/")[2],
                Path: Imagepath,
                Id: Processid,
                ValidTicket: decode ? true : false
        });
        console.log("final array is"+ ticketResult);



}

function writeToDB(infoObject) {
        return dbService.connectDb(config.DB_CONFIG.CONNECTIONSTRING, {})
                .then(() => dbService.insert(infoModel(dbService), infoObject))
                .then(data => dbService.disconnectDb(data))
                .then(data => console.log("success"))
                .catch((error) => {
                        dbService.disconnectDb(error).then(() => {
                                throw error;
                        })
                });
}

function uploadImages(context, _images, cb) {
        numCompleted = 1;
          ticketResult = {
                "TicketName": srcFilename + ".pdf",
                "TicketPath": dstBucket + "/"+ srcFilename + ".pdf",               
                "Ticketpages": []
        };
        for (var i = 1; i <= _images; i++) {
                console.log(_images);
                console.log(dstKey + "/" + srcFilename + "_" + i);
                upload(dstBucket,ticketResult, srcFilename, dstKey + "/images/" + srcFilename + "/" + i + ".jpeg", "/tmp/" + i + ".jpeg", "image/jpeg", function (err, data) {
                        numCompleted++;
                        if (numCompleted > _images) {
                                cb();
                        }
                });
        }
}
exports.handler = function (event, context) {
        var srcBucket = event.Records[0].s3.bucket.name;
        var srcKey = event.Records[0].s3.object.key;
        dstBucket = srcBucket;
        var srcFilenameArr = srcKey.split(".");
        srcFileKey = srcFilenameArr[0];
        var srcFileExt = srcFilenameArr[1].toLowerCase();
        srcFilename = srcFileKey.substring(srcFileKey.lastIndexOf('/') + 1);
        dstKey = srcFileKey.substring(0, (srcFileKey.lastIndexOf('/') > 0 ? srcFileKey.lastIndexOf('/') : srcFileKey.length));
        stored_pdf = "/tmp/" + srcFilename + ".pdf";
        Processid = srcFilename;
        uploadInfoObject = {
                ProcessId: Processid,
                Type: "Ticket",
                ModifiedDate: new Date(),
                Status: "Started",
                Message: "Processing Started",
                Details: {}
        };
        writeToDB(uploadInfoObject).then(() => {
                        var validFileTypes = ['pdf'];
                        if (validFileTypes.indexOf(srcFileExt) < 0) {
                                context.done(null, {
                                        status: false,
                                        message: 'File extension does not match.'
                                });
                                uploadInfoObject = {
                                        ProcessId: context.invokeid,
                                        Type: "Ticket",
                                        ModifiedDate: new Date(),
                                        Status: "Started",
                                        Message: "Extension does not match.Not a valid PDF"
                                };
                                writeToDB(uploadInfoObject);
                        }
                        s3.getObject({
                                Bucket: srcBucket,
                                Key: srcKey
                        }, function (err, data) {
                                if (err) {
                                        console.log(err);
                                        context.done(null, {
                                                status: false,
                                                message: 'Unable to download the file.'
                                        });

                                } else {

                                        fs.writeFile(stored_pdf, data.Body, {
                                                encoding: null
                                        }, function (fserr) {

                                                if (fserr) {

                                                        context.done(null, {
                                                                status: false,
                                                                message: 'Unable to copy file into tmp directory.'
                                                        });
                                                } else {
                                                        console.log('File Downloaded! ' + data.ContentType);
                                                        var exec = require('child_process').exec,
                                                                child;
                                                        child = exec('gs -sDEVICE=jpeg -dTextAlphaBits=4 -r300 -o /tmp/%d.jpeg ' + stored_pdf, function (error,
                                                                stdout, stderr) {
                                                                if (error !== null) {
                                                                        console.log('exec error: ' + error);
                                                                        context.done(null, {
                                                                                status: false,
                                                                                message: 'Error in creating images.'
                                                                        });
                                                                } else {
                                                                        uploadInfoObject = {
                                                                                ProcessId: Processid,
                                                                                Type: "Ticket",
                                                                                ModifiedDate: new Date(),
                                                                                Status: "Processing",
                                                                                Message: "Splitting into pages and detecting a valid ticket",
                                                                                Details: {}
                                                                        };

                                                                        writeToDB(uploadInfoObject).then(() => {
                                                                                        child = exec('gs -q  -dNODISPLAY  -c "(' + stored_pdf +
                                                                                                ') (r) file runpdfbegin pdfpagecount = quit"',
                                                                                                function (error, stdout, stderr) {
                                                                                                        if (error !== null) {
                                                                                                                console.log('exec error: ' + error);
                                                                                                                context.done(null, {
                                                                                                                        status: false,
                                                                                                                        message: 'Error in getting pdf page count.'
                                                                                                                });
                                                                                                        } else {

                                                                                                                uploadImages(context, stdout, function () {
                                                                                                                        console.log(ticketResult);
                                                                                                                        uploadInfoObject = {
                                                                                                                                ProcessId: Processid,
                                                                                                                                Type: "Ticket",
                                                                                                                                ModifiedDate: new Date(),
                                                                                                                                Status: "Done",
                                                                                                                                Message: "Process completed",
                                                                                                                                Details: ticketResult
                                                                                                                        };

                                                                                                                        writeToDB(uploadInfoObject).then(() => {
                                                                                                                                console.log("all done")
                                                                                                                                context.done(null, {
                                                                                                                                        status: true,
                                                                                                                                        message: ticketResult
                                                                                                                                });
                                                                                                                        });


                                                                                                                });



                                                                                                        }
                                                                                                });
                                                                                })
                                                                                .catch(err => {

                                                                                })
                                                                }
                                                        });
                                                }
                                        });
                                }
                        });
                })
                .catch(err => {

                })


};