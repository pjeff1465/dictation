const playBtn = document.querySelector(".play-button");
const pauseBtn = document.querySelector(".pause-button");
const stopBtn = document.querySelector(".stop-button");

let mediaRecorder;
let chunks = [];
let stream;
let startTime, timerInterval;
let analyser, dataArray;

// audio timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.querySelector(".timer").textContent = `Recording: ${elapsed}s`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    document.querySelector(".timer").textContent = "Not recording";
}

// audio visualizer
function setupVisualizer(stream){
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    const canvas = document.querySelector("canvas");
    const canvasCtx = canvas.getContext("2d");

    function draw(){
        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = "black";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "white";

        canvasCtx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            if(i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }
    draw();
}

// start recording
playBtn.addEventListener("click", async () => {
    if(!navigator.mediaDevices) {
        alert("Media devices not supported in this browser! Plug in external mic.")
        return;
    }

    if (mediaRecorder && mediaRecorder.state === "paused") {
        mediaRecorder.resume();
        startTimer();
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        setupVisualizer(stream);

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
            const audioURL = URL.createObjectURL(blob);
            
            const audioElement = new Audio(audioURL);
            audioElement.controls = true;
            document.body.appendChild(audioElement);

            chunks = [];
            stream.getTracks().forEach(track => track.stop());
            stopTimer();
        };

        mediaRecorder.start();
        startTimer();
        console.log("Recording started");
    } catch (err) {
        console.error("Microphone access denied or error:", err);
    }
});

// Pause/ Resume Microphone
pauseBtn.addEventListener("click", () => {
    if (mediaRecorder) {
        if (mediaRecorder.state === "recording") {
            mediaRecorder.pause();
            stopTimer();
            console.log("Recording paused")
        } else if (mediaRecorder.state === "paused") {
            mediaRecorder.resume();
            startTimer();
            console.log("Recording resumed");
        }
    }
});

// can add if statement to clear audio when pressed stopped or limit to one
stopBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        console.log("Recording stopped");
        stopTimer();
    }
});


// // create media element source of audio const
// const source = audioContext.createMediaElementSource(audio);

// // create destination (speakers) for source
// source.connect(audioContext.destination);

// // Verify enough data has been loaded to play the media up to its end w/o stopping and buffering
// audio.addEventListener("canplaythrough", () => {
//     playBtn.addEventListener("click", () => {
//         if (audioContext.state === "suspended"){
//             audioContext.resume();
//         }
//         audio.play();
//     });
// });

// pauseBtn.addEventListener("click", () => {
//     audio.pause();
// });
// stopBtn.addEventListener("click", () => {
//     audio.pause();
//     audio.currentTime = 0;
// });


