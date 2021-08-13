const fs = require('fs');
const util = require('util');

const {
    Storage
} = require('@google-cloud/storage');

var labelVideo = function (label, index) {

    var p1 = index % 2;
    var p2 = (index + 1) % 2;
    var command = "ffmpeg -y -i ./processing-" + p1 + ".mp4 -vf \"drawtext=fontfile=/System/Library/Fonts/SFNSMono.ttf:text='" + label + "':fontcolor=white:fontsize=50:box=1:boxcolor=black@0.5:boxborderw=5:x=50:y=(h-text_h)/2:enable='between(t," + index + "," + (index + 1) + ")'\" -codec:a copy processing-" + p2 + ".mp4";

    var result = require('child_process').execSync(command);

    console.log(result);
}

// Creates a client
const storage = new Storage();

var gcsFile = 'gs://video-intelligence/example.MP4';
var frags = gcsFile.match(/[^\/]+/gi);

(async function () {

    const options = {
        destination: "./processing-0.mp4",
    };

    // Downloads the video file as 'processing-0.mp4', needed for created labeled video
    await storage.bucket(frags[1]).file(frags[2]).download(options);

    // Imports the Google Cloud Video Intelligence library + Node's fs library
    const video = require('@google-cloud/video-intelligence').v1p2beta1;

    // Creates a client
    const client = new video.VideoIntelligenceServiceClient();

    /*
    const path = 'Local file to analyze, e.g. ./my-file.mp4';
    Reads a local video file and converts it to base64
    const readFile = util.promisify(fs.readFile);
    const file = await readFile("./outside.MP4");
    const inputContent = file.toString('base64');
    */

    // Constructs request
    const request = {
        inputUri: gcsFile,
        features: ['TEXT_DETECTION'],
        videoContext: {
            "labelDetectionConfig": {
                "labelDetectionMode": "FRAME_MODE",
                "stationaryCamera": false
            }
        }
    };






    const [operation] = await client.annotateVideo(request);
    const results = await operation.promise();
    console.log('Waiting for operation to complete...');
    // Gets annotations for video
    const textAnnotations = results[0].annotationResults[0].textAnnotations;


    console.log(textAnnotations);


    fs.writeFileSync('./text.json', JSON.stringify(textAnnotations));



    var annotations = [];

 
   

/*

    labels.forEach(function (label, index) {

        var startTime = label.frames[0].timeOffset.seconds;
        var endTime = label.frames[label.frames.length - 1].timeOffset.seconds;

        while (startTime != endTime) {
            if (!!annotations[startTime]) {
                annotations[startTime] = annotations[startTime] + "\n" + label.entity.description;
            } else {
                annotations[startTime] = label.entity.description;
            }
            startTime++;
        }
    });

    */




    textAnnotations.forEach(textAnnotation => {
        console.log(`Text ${textAnnotation.text} occurs at:`);
        textAnnotation.segments.forEach(segment => {
            const time = segment.segment;
            console.log(
                ` Start: ${time.startTimeOffset.seconds || 0}.${(
        time.startTimeOffset.nanos / 1e6
      ).toFixed(0)}s`
            );
            console.log(
                ` End: ${time.endTimeOffset.seconds || 0}.${(
        time.endTimeOffset.nanos / 1e6
      ).toFixed(0)}s`
            );
            console.log(` Confidence: ${segment.confidence}`);
            segment.frames.forEach(frame => {
                const timeOffset = frame.timeOffset;
                console.log(
                    `Time offset for the frame: ${timeOffset.seconds || 0}` +
                    `.${(timeOffset.nanos / 1e6).toFixed(0)}s`
                );
                console.log('Rotated Bounding Box Vertices:');
                frame.rotatedBoundingBox.vertices.forEach(vertex => {
                    console.log(`Vertex.x:${vertex.x}, Vertex.y:${vertex.y}`);
                });
            });
        });
    });















})();