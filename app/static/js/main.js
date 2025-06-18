// FrontEnd JavaScript (runs in browser)

const playBtn = document.querySelector(".play-button");
const pauseBtn = document.querySelector(".pause-button");
const stopBtn = document.querySelector(".stop-button");
const transcribeBtn = document.querySelector(".transcribe-button");
const cleanBtn = document.querySelector(".clean-button");
const submitBtn = document.querySelector(".submit-button");

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
    const progressBarContainer = document.getElementById("myProgressBar-transcribe");
    const progressBar = progressBarContainer.querySelector(".bar");

    let width = 0;

    // progress bar
    progressBarContainer.style.display = "block";
    transcribeBtn.disabled = true;

    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            transcribeBtn.disabled = false;
        } else {
            width++;
            progressBar.style.width = width + "%";
        }
    }, 80); // update every 50ms 

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
    } finally {
        // stop progress bar
        clearInterval(interval);
        progressBar.style.width = "100%";
        progressBarContainer.style.display = "none";
        transcribeBtn.disabled = false;
    }
});

// ai input with dropboxes
document.getElementById("ai_prompt").addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);

    const progressBarContainer = document.getElementById("myProgressBar-clean")
    const progressBar = progressBarContainer.querySelector(".bar");

    progressBarContainer.style.display = "block";
    transcribeBtn.disabled = true;
    
    console.log(formData);

    let width = 0

    // progress bar
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            transcribeBtn.disabled = false;
        } else {
            width++;
            progressBar.style.width = width + "%";
        }
    }, 100); // update every 100ms 

    try {
        const response = await fetch("/dictation", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        document.getElementById("clean-box").value = result.cleaned;
    } catch (err) {
        console.error("Error:", err);
    } finally {
        submitBtn.disabled = false;
        progressBar.style.width = "100%";
        progressBarContainer.style.display = "none";
    }
});

// ai input with customized prompt
cleanBtn.addEventListener("click", async function () {
    console.log("Clean button clicked!")
    const prompt = document.getElementById("prompt-box").value;
    const text = document.getElementById("transcription-box").value;

    const progressBarContainer = document.getElementById("myProgressBar-clean")
    const progressBar = progressBarContainer.querySelector(".bar");

    progressBarContainer.style.display = "block";
    transcribeBtn.disabled = true;

    let width = 0

    // progress bar
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            transcribeBtn.disabled = false;
        } else {
            width++;
            progressBar.style.width = width + "%";
        }
    }, 100); // update every 80ms 

    try {
        const response = await fetch("http://localhost:8000/clean", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_input: prompt, text: text })
        });

        const result = await response.json();
        document.getElementById("clean-box").value = result.cleaned;
    } catch (err) {
        console.error("Error:", err);
    } finally {
        cleanBtn.disabled = false;
        progressBar.style.width = "100%";
        progressBarContainer.style.display = "none";
    }
});

// JavaScipt to download pdf
window.downloadPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const text = document.getElementById('transcription-box').value;
    doc.text(text, 10, 10);

    doc.save("transcription.pdf");
}
