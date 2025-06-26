// FrontEnd JavaScript (runs in browser)

// Event Buttons
const playBtn = document.querySelector(".play-button");
const pauseBtn = document.querySelector(".pause-button");
const stopBtn = document.querySelector(".stop-button");
const transcribeBtn = document.querySelector(".transcribe-button");
const cleanBtn = document.querySelector(".clean-button");
const submitBtn = document.querySelector(".submit-button");

// 
const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Sounds
const recordingStart = new Audio('/static/sounds/recording_start.mp3')
const recordingStop = new Audio('/static/sounds/recording_stop.mp3')
const clickSound = new Audio('/static/sounds/click.wav')
const waitingSound = new Audio('/static/sounds/waiting_music.wav')

// Variables
let mediaRecorder;
let chunks = [];
let stream;
let startTime, timerInterval;
let analyser, dataArray;
let isRecording = false;
let helpOpen = false;
let cancelHelp = false;
let recognition = null;

// #############################################################################################
// ##                              FUNCTIONS                                                  ##
// #############################################################################################

async function speakAsync(text) {
    return new Promise((resolve) => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = resolve;
        speechSynthesis.speak(utterance);
    });
}

async function pauseRecognition(text) {
    stopRecognition();
    await speakAsync(text);
    startRecognition();
}

// -------------- HELP MENU ------------------

async function speakHelpMenu() {
    cancelHelp = false;
    await speakAsync("You have opened the help menu!");
    if (cancelHelp) return;
    await speakAsync("If you want to leave anytime, press the space bar.");
    if (cancelHelp) return;
    await speakAsync("To writeEZ record your audio and let us transcribe it to text. Then, decide what you will use your transcription for. Whether its for a paper or simply an email, we will turn your writing into the perfect format for you!")
    if (cancelHelp) return;
    await speakAsync("To record an audio press the 'r' key");
    if (cancelHelp) return;
    await speakAsync("To pause or resume recording say, pause or resume recording. Or press the 'p' key.");
    if (cancelHelp) return;
    await speakAsync("To end recording say, stop recording, or press the 's' key");
    if (cancelHelp) return;
    await speakAsync("To transcribe your audio to text, press the 't' key.")
}
// ------------ Audio Visualizer Funcs -------------------
// Timer func
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

// ------------ check input focus ------------------
function isEditableElement(element) {
    return element.tagName === "INPUT" || 
    element.tagName === "TEXTAREA" || 
    element.isContentEditable;
}

// ------------ Recording Funcs -------------------
// start recording
async function startRecording() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder = new MediaRecorder(stream);
        setupVisualizer(stream);
        chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        mediaRecorder.onstop = stopRecording;

        mediaRecorder.start();
        startTimer();
        console.log("Recording started");
    } catch (err) {
        console.error("Microphone access denied or error:", err);
        alert("Unable to access microphone.");
    }
}
// Stop Recording Func 
function stopRecording() {

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        recordingStop.play();
        console.log("Recording stopped");
    
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: "audio/webm" });
            const audioURL = URL.createObjectURL(blob);

            const audioContainer = document.querySelector("#audio-container");
            audioContainer.innerHTML = "";

            const audioElement = new Audio(audioURL);
            audioElement.controls = true;
            audioContainer.appendChild(audioElement);

            stopTimer();
        }
    } else {
        console.warn("MediaRecorder not active.")
    }
}

// 'r' press func
async function handleRtoggle() {
    recordingStart.play();

    if (!navigator.mediaDevices) {
        alert("Media devices not supported in this browser! Plug in external microphone.");
        speak("Media devices not supported in this browser! Plug in external microphone.");
        return;
    }
    if (mediaRecorder && mediaRecorder.state === "paused") {
        mediaRecorder.resume();
        startTimer();
        return;
    }

    await startRecording();
    isRecording = !isRecording;
}

// -------------- Pause/ Resume Func ------------
function pauseRecording() {
    if (!mediaRecorder) return;

    clickSound.play();

    if (mediaRecorder.state === "recording") {
        mediaRecorder.pause();
        stopTimer();
        console.log("Recording paused")
    } else if (mediaRecorder.state === "paused") {
        mediaRecorder.resume();
        startTimer();
        console.log("Recording resumed")
    }
}

// ------------ Transcribe Audio Func ----------------
async function transcribeAudio() {
    speak("Transcribing audio.....")

    waitingSound.play();

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
        waitingSound.pause();
        waitingSound.currentTime = 0;
        speak("Transcription Finished!")
    }
}

// ---------------------------------- voice commands ------------------------------------
// Logic for speak pause recording
function initRecognition() {
    if (!speechRecognition) {
        console.warn("Speech Recognition API not supported.");
        return;
    }

    recognition = new speechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = handleSpeechResult;
    recognition.onerror = (e) => console.error("Speech error:", e.error);
    recognition.onend = () => console.log("Speech recognition ended.");
}

function startRecognition() {
    if (!recognition) return;

    try {
        recognition.start();
        console.log("Voice recognition started.");
    } catch (err) {
        console.warn("Could not start speech recognition:", err);
    }
}

function stopRecognition() {
    if (!recognition) return;

    try {
        recognition.stop();
        console.log("Voice recognition stopped.");
    } catch (err) {
        console.warn("Could not stop speech recognition:", err);
    }
}

async function handleSpeechResult(event) {
    const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join("")
        .toLowerCase();
    
    console.log("Heard:", transcript);
    await processCommand(transcript);
}

async function processCommand(transcript) {
    if (!mediaRecorder) {
        console.warn("mediaRecorder not available.");
        return;
    }

    if (transcript.includes("begin recording")) {
        if (mediaRecorder.state === "paused") {
            mediaRecorder.resume();
            await pauseRecognition("Resuming recording.");
        } else if (mediaRecorder.state === "inactive") {
            mediaRecorder.start();
            await pauseRecognition("Starting recording.");
        }
    }

    if (transcript.includes("pause recording")) {
        if (mediaRecorder.state === "recording") {
            mediaRecorder.pause();
            await pauseRecognition("Recording paused.");
        }
    }
    
    if (transcript.includes("resume recording")) {
        if (mediaRecorder.state === "paused") {
            mediaRecorder.resume();
            await pauseRecognition("Resuming recording.")
        }
    }

    if (transcript.includes("transcribe")) {
        if (mediaRecorder.state === "inactive" && typeof mediaRecorder.transcribeBtn === "function") {
            mediaRecorder.transcribeBtn();
            await pauseRecognition("Transcribing audio....")
        }
    }
}

// start voice recongnition when window is open
window.addEventListener("DOMContentLoaded", () => {
    initRecognition();
    startRecognition();
    // if (recognition) {
    //     try {
    //         recognition.start();
    //         console.log("Voice recognition started.");
    //     } catch (err) {
    //         console.warn("Speech recognition failed to start:", err);
    //     }
    // }
});

// if (speechRecognition) {
//         let command = false
        
//         if(transcript.includes("begin recording")) {
//             if (mediaRecorder.state === "paused") {
//                 mediaRecorder.resume();
//                 speak("Resuming recording.");
//             } else if (mediaRecorder.state === "inactive" || !mediaRecorder) {
//                 mediaRecorder.start()
//                 speak("Starting recording.");
//             }
//         }
//         if(transcript.includes("pause recording")) {
//             if(mediaRecorder.state === "recording") {
//                 mediaRecorder.pause()
//                 speak("Recording Paused.");
//             }
//         }
//         if(transcript.includes("resume recording")) {
//             if(mediaRecorder.state === "paused") {
//                 mediaRecorder.resume()
//                 speak("Resume recording.")
//             }
//         }
//         if(transcript.includes("stop recording")) {
//             if (mediaRecorder.state === "recording" || mediaRecorder.state === "paused") {
//                 mediaRecorder.stop();
//                 speak("Recording stopped.");
//                 recognition.stop();
//             }
//         }
//         if(transcript.includes("transcribe")) {
//             if (mediaRecorder.state === "inactive" || !mediaRecorder) {
//                 mediaRecorder.transcribeBtn();
//                 speak("Transcriping audio....");
//                 recognition.stop();
//             }
//         }
//     };

// speech function
function speak(text) {
    if (recognition && recognition.stop) {
        recognition.stop();
    }
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onend = () => {
        try {
            recognition.start();
        } catch (err) {
            console.warn("Recognition resume failed:", err);
        }
    };

    window.speechSynthesis.speak(utterance);
}
// #############################################################################################
// ##                               EVENTS                                                    ##
// #############################################################################################
// ------------- Play Button ------------- 
// button command
playBtn.addEventListener("click", handleRtoggle);

// keyboard command
window.addEventListener("keydown", async function (event) {
    const activeElem = document.activeElement;
    if (isEditableElement(activeElem)) return;

    if (event.key === "r" || event.key === "R") {
        await handleRtoggle();
    }
});

// ------------------- Pause/ Resume recording -----------------------
// button command
pauseBtn.addEventListener("click", pauseRecording);

// 'p' keyboard command
window.addEventListener("keydown", async function (event) {
    const activeElem = document.activeElement;
    if (isEditableElement(activeElem)) return;

    if (event.key === 'p' || event.key === 'P') {
        pauseRecording();
    }
});

// --------------------------- Stop Button -------------------------------------
// button stop
stopBtn.addEventListener("click", stopRecording);

// keyboard stop
window.addEventListener("keydown", async function (event) {
    if (event.key === 's' || event.key === 'S') {
        stopRecording();
    }
});

// ----------------- Transcribe Event --------------------
// button command
transcribeBtn.addEventListener("click", transcribeAudio);

// keyboard command
window.addEventListener("keydown", async function (event) {
    const activeElem = document.activeElement;
    if (isEditableElement(activeElem)) return;

    if (event.key === 't' || event.key === 'T'){
        transcribeAudio();
    }
});

// ----------------------- AI --------------------------
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

// ------------ Help Menu Event ---------------------
window.addEventListener("keydown", function (event) {

    if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        if(helpOpen) {
            speechSynthesis.cancel();
            cancelHelp = true
            speak("Exiting help menu...");
            helpOpen = false;
        } 
        return;
    }
    if (event.key === "h" && !helpOpen) {
        helpOpen = true
        speakHelpMenu();
    }

});


