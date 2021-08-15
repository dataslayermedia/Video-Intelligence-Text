var getTextBoxArray = function (currentTime) {

    var boundingBoxes = [];
    visionData.forEach(function (a, b) {

        var currentTimeStamp;

        for (var i = 0; i < a.segments[0].frames.length; i++) {

            if (!!a.segments[0].frames[i].timeOffset.seconds) {
                currentTimeStamp = a.segments[0].frames[i].timeOffset.seconds;
            }

            if (!!a.segments[0].frames[i].timeOffset.nanos) {
                if (!!currentTimeStamp) {
                    currentTimeStamp = currentTimeStamp + "." + a.segments[0].frames[i].timeOffset.nanos;
                } else {
                    currentTimeStamp = "0." + a.segments[0].frames[i].timeOffset.nanos;
                }
            }

            if (currentTimeStamp > currentTime) {
                if (!!a.segments[0].frames[i - 1]) {
                    boundingBoxes.push({
                        "label": a.text,
                        "box": a.segments[0].frames[i - 1].rotatedBoundingBox.vertices
                    });
                    break;
                }
            }

            currentTimeStamp = null;
        }
    });

    return boundingBoxes;
}


window.start = 0;

var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var video = document.querySelector("#my-video");


var processor = {

    timerCallback: function () {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.computeFrame();
        var self = this;

        setTimeout(function () {
            self.timerCallback();
        }, 16); // roughly 60 frames per second
    },

    doLoad: function () {
        this.video = document.getElementById("my-video");
        this.c1 = document.getElementById("my-canvas");
        this.ctx1 = this.c1.getContext("2d");
        var self = this;

        this.video.addEventListener("play", function () {
            self.width = self.video.width;
            self.height = self.video.height;
            self.timerCallback();
        }, false);
    },

    computeFrame: function () {

        window.start++;

        var currentTime = video.currentTime;

        if (window.start % 4 == 0) {
            canvas.width += 0;
        }

        // Copy original video image into canvas
        ctx.drawImage(this.video, 0, 0, this.width, this.height);

        var thisWidth = this.width;
        var thisHeight = this.height;

        var pX;
        var pY;
        var yDelta;
        var xDelta;
        var width;
        var height;

        var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop("0", "blue");
        gradient.addColorStop("0.8", "magenta");
        gradient.addColorStop("1.0", "red");

        var boxes = getTextBoxArray(currentTime);

        boxes.forEach(function (a, b) {
            pX = thisWidth * a.box[0].x;
            pY = thisHeight * a.box[0].y;

            var yDelta = thisHeight * a.box[3].y;
            var xDelta = thisWidth * a.box[2].x;

            var width = xDelta - pX;
            var height = yDelta - pY;
           // console.log(boxes.length);

            ctx.rect(pX, pY, width, height);

           // console.log(a);


            ctx.font = "19px Verdana";
            // Create gradient

            // Fill with gradient
            ctx.fillStyle = gradient;
            ctx.fillText(a.label, pX, pY - 2);



        });

        ctx.lineWidth = "3";
        ctx.strokeStyle = gradient;
        ctx.stroke();

        var frame = ctx.getImageData(0, 0, this.width, this.height);
        ctx.putImageData(frame, 0, 0);
        return;
    }
};

processor.doLoad();

var visionData;

(async function () {
    var response = await fetch('http://localhost:8080/text.json');
    response = await response.text();
    // waits until the request completes...
    visionData = JSON.parse(response);
}());