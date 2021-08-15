const fs = require('fs');
const util = require('util');

var gcsFile = 'gs://video-intelligence/example.MP4';

(async function () {


    // Imports the Google Cloud Video Intelligence library + Node's fs library
    const video = require('@google-cloud/video-intelligence').v1p2beta1;

    // Creates a client
    const client = new video.VideoIntelligenceServiceClient();

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


    fs.writeFileSync('./html/text.json', JSON.stringify(textAnnotations));

    

    // Text Detection Read Out to the Console

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