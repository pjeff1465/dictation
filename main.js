// FrontEnd JavaScript (runs in browser)

const playBtn = document.querySelector(".play-button");
const pauseBtn = document.querySelector(".pause-button");
const stopBtn = document.querySelector(".stop-button");
const transcribeBtn = document.querySelector(".transcribe-button");
const cleanBtn = document.querySelector(".clean-button");

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

// Play Button 
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
        chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: "audio/webm" });
            const audioURL = URL.createObjectURL(blob);
            const audioContainer = document.querySelector("#audio-container");
            audioContainer.innerHTML = "";

            const audioElement = new Audio(audioURL);
            audioElement.controls = true;
            audioContainer.appendChild(audioElement);

            //stream.getTracks().forEach(track => track.stop());
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

// Stop Button
stopBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();

            stream.getTracks().forEach(track => track.stop());
            console.log("Recording stopped");
    }
});

// Transcribe Button
transcribeBtn.addEventListener("click", async () => {
    if (!chunks.length) {
        console.warn("No audio to transcribe!");
        return;
    }

    // create audio blob and URL
    const blob = new Blob(chunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");

    // create audio element
    const audioURL = URL.createObjectURL(blob);
    const audioElement = new Audio(audioURL);
    audioElement.controls = true;

    // display in container
    const audioContainer = document.querySelector("#audio-container");
    audioContainer.innerHTML = "";
    audioContainer.appendChild(audioElement);

    // call backend to transcribe audio
    try {
        const response = await fetch("http://localhost:8000/transcribe", {
            method: "POST",
            body: formData
        });
        console.log(response);

        const data = await response.json();
        console.log(data);
        document.querySelector("#transcription-box").value = data.transcription;
    } catch (err) {
        console.error("Transcription error:", err);
    }
});

// Clean up transcribed text
cleanBtn.addEventListener("click", async () => {
    const rawText = document.querySelector("#transcription-box").value;

    try {
        const clean_response = await fetch("http://localhost:8000/clean", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: rawText })
        });

        const data = await clean_response.json();
        console.log("Model response:", data);

        document.querySelector("#clean-box").value = data.cleaned;
        
    } catch (err) {
        console.error("Clean-up error:", err);
    }
}); 