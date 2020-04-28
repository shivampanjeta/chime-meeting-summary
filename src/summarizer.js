const AWS = require('aws-sdk'),
  s3 = new AWS.S3(),
  sagemakerruntime = new AWS.SageMakerRuntime(),
  ses = new AWS.SES({ region: 'us-east-1' }),
  path = require('path'),
  ENDPOINT_NAME = process.env.ENDPOINT_NAME;

exports.handler = (event, context, callback) => {
    const eventRecord = event.Records && event.Records[0],
    inputBucket = eventRecord.s3.bucket.name,
    key = eventRecord.s3.object.key,
    id = context.awsRequestId,
    emailId = "meghnav@amazon.com";
  s3.getObject({
        Bucket: inputBucket,
        Key: key
    }, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(err);
        } else {
            const record = JSON.parse(data.Body);
            const transcribedText = record.results.transcripts[0].transcript;
            var params = {
              Body: transcribedText,
              ContentType: 'application/json',
              EndpointName: ENDPOINT_NAME
            };
            sagemakerruntime.invokeEndpoint(params, function(err, data) {
              if (err) console.log(err, err.stack);
              else     sendEmail(emailId, data); 
            });
        }
    });
};

function sendEmail(emailId, data, callback) {
    var params = {
        Destination: {
            ToAddresses: [emailId]
        },
        Message: {
            Body: {
                Text: {
                    Data: data
                }
            },
            Subject: {
                Data: "Chime Meeting Summary"
            }
        },
        Source: "panjetas@amazon.com"
    };


    ses.sendEmail(params, function(err, data) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(data);
        }
    });
}
