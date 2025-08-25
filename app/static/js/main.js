// FrontEnd JavaScript (runs in browser)

// Event Buttons
const playBtn = document.querySelector(".play-button");
const pauseBtn = document.querySelector(".pause-button");
const stopBtn = document.querySelector(".stop-button");
const transcribeBtn = document.querySelector(".transcribe-button");
const cleanBtn = document.querySelector(".clean-button");
const submitBtn = document.querySelector(".submit-button");

// audio file upload
//const audioFile = document.getElementById('audioFile');
// @ts-ignore
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

//const speechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Sounds
const recordingStart = new Audio('/static/sounds/recording_start.mp3')
const recordingStop = new Audio('/static/sounds/recording_stop.mp3')
const clickSound = new Audio('/static/sounds/click.wav')
const waitingSound = new Audio('/static/sounds/waiting_music.wav')
const cleanupWait = new Audio('/static/sounds/cleanup_wait.wav')

// Variables
let mediaRecorder;
let chunks = [];
let stream;
let startTime, timerInterval;
let analyser, dataArray;
let isRecording = false;
let helpOpen = false;
let cancelHelp = false;
let uploadFileBlob = null;
let uploadedFileBlob = null;
let previousAudioURL = null;
let activeAudioBlob = null;
let recordedBlob = null;


//window.tabAudioData = {};

//let recognition = new speechRecognition;

// #############################################################################################
// ##                              FUNCTIONS                                                  ##
// #############################################################################################
// speech function
function speak(text) {
    // Remove speech recognition
    // if (recognition && recognition.stop) {
    //     recognition.stop();
    // }
    const utterance = new SpeechSynthesisUtterance(text);

    // Remove Speech recognition
    // utterance.onend = () => {
    //     try {
    //         recognition.start();
    //     } catch (err) {
    //         console.warn("Recognition resume failed:", err);
    //     }
    // };

    window.speechSynthesis.speak(utterance);
}

async function speakAsync(text) {
    return new Promise((resolve) => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = resolve;
        speechSynthesis.speak(utterance);
    });
}

// removing speech recognition
// async function pauseRecognition(text) {
//     stopRecognition();
//     await speakAsync(text);
//     startRecognition();
// }

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
    if (cancelHelp) return;
    await speakAsync("To hear your transcribed text, press '1' ");
    if (cancelHelp) return;
    await speakAsync("If there is an error with your transcription, press '2' to edit.")
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
    console.log("stop timer called");
    clearInterval(timerInterval);
    document.querySelector(".timer").textContent = "Not recording";
}

// audio visualizer
function setupVisualizer(stream){
    //const audioContext = new AudioContext();
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

// ------------ Audio File Upload -----------------
//const audioContext = new AudioContext();

// play decoded audio buffer
function playAudioBuffer(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
}

// upload handler
async function uploadAudio(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (previousAudioURL) {
        URL.revokeObjectURL(previousAudioURL);
        previousAudioURL = null;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const arrayBuffer = e.target.result;
        try {
            //const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            // playAudioBuffer(audioBuffer);
            await audioContext.decodeAudioData(arrayBuffer);

            const activeTab = document.querySelector('.tab-content.active');
            const activeTabId = activeTab ? activeTab.id : 'dictation';

            if (!window.tabAudioData) window.tabAudioData = {};

            window.tabAudioData[activeTabId] = {
                ...(window.tabAudioData[activeTabId] || {}),
                audioBlob: file
            };

            const audioURL = URL.createObjectURL(file);
            previousAudioURL = audioURL;

            const audioElement = new Audio(audioURL);
            audioElement.controls = true;

            const audioContainer = document.querySelector("#audio-container");
            if (audioContainer) {
                audioContainer.innerHTML = "";
                audioContainer.appendChild(audioElement);
            } else {
                console.warn("#audio-container not found in DOM");
            }

        } catch (err) {
            console.error("Error decoding audio file", err);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ------------ Recording Funcs -------------------
// start recording
async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Media devices not supported in this browser! Plug in external microphone.");
        speak("Media devices not supported in this browser! Plug in external microphone.");
        return;
    }

    if (mediaRecorder) {
        if (mediaRecorder.state === "paused") {
            mediaRecorder.resume();
            startTimer();
            speak("Recording resumed.");
            isRecording = true;
            return;
        } else if (mediaRecorder.state === "recording") {
            console.warn("Recording already in progress");
            return;
        }
    }

    speak("Begin Recording");
    recordingStart.play();

    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        setupVisualizer(stream);
        chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = stopRecording;

        mediaRecorder.start();
        startTimer();
        console.log("Recording started");
    } catch (err) {
        console.error("Microphone access denied or error:", err);
        alert("Unable to access microphone.");
        speak("Unable to access microphone.");
    }

}

// -------------- Pause/ Resume Func ------------
function pauseRecording() {
    if (!mediaRecorder) return;

    clickSound.play();

    if (mediaRecorder.state === "recording") {
        speak("Recording Paused.")
        mediaRecorder.pause();
        stopTimer();
        console.log("Recording paused")
    } else if (mediaRecorder.state === "paused") {
        speak("Recording Resumed.")
        mediaRecorder.resume();
        startTimer();
        console.log("Recording resumed")
    }
}

// ------------------- STOP FUNC --------------------
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        speak("Recording Stopped.");
        recordingStop.play();

        // mediaRecorder.stop();
        // stream.getTracks().forEach(track => track.stop());
        // console.log("Recording stopped");

        mediaRecorder.onstop = () => {
            // for the create paper page
            const blob = new Blob(chunks, { type: "audio/webm" });
            
            const activeTab = document.querySelector('.tab-content.active');
            
            if(activeTab) {
                const activeTabId = activeTab.id; 

                const tabAudioData = window.tabAudioData || {};
                tabAudioData[activeTabId] = {
                    ...tabAudioData[activeTabId],
                    audioBlob: blob
                };
                window.tabAudioData = tabAudioData;
                activeAudioBlob = blob;
            } else {
                // for the dictation page
                recordedBlob = blob;
                uploadFileBlob = null;
                activeAudioBlob = blob;
            }

            const audioURL = URL.createObjectURL(blob);
            
            //const audioContainer = document.querySelector("#audio-container");
            const audioContainer = activeTab?.querySelector('.tab-audio') || document.querySelector("#audio-container");

            if (audioContainer) {
                audioContainer.innerHTML = "";
            
                const audioElement = new Audio(audioURL);
                audioElement.controls = true;
                audioContainer.appendChild(audioElement);
            }
        
            stopTimer();

        };

        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        console.log("Recording stopped");

    } else {
        console.warn("MediaRecorder not active.");
    }
}

// Function to auto insert transcription into correct tab
// function insertTranscriptionIntoActiveTab(transcriptionText, audioBlob) {
//     const activeTab = document.querySelector('.tab-content.active');
//     let textArea;
//     let audioContainer;

//     if (activeTab) {
//         textArea = activeTab.querySelector('textarea');
//         audioContainer = activeTab.querySelector('.tab-audio');
//     } else {
//         textArea = document.querySelector('#dictation-textarea') || document.querySelector('textarea');
//         audioContainer = document.querySelector('#audio-container');
//     }
//     //if(!activeTab) return;


//     //const tabId = activeTab.id
//     //const textArea = activeTab.querySelector('textarea');
    
//     if (textArea) {
//         textArea.value = transcriptionText;
//     }
    
//     //const audioContainer = activeTab.querySelector('.tab-audio');

//     // if (activeTextarea) {
//     //     activeTextarea.value += text; // doing += instead of = means append
//     // }

//     // if (textArea) {
//     //     textArea.value = transcriptionText;
//     // }

//     if (audioBlob && audioContainer) {
//         const audioURL = URL.createObjectURL(audioBlob);
//         const audioElement = new Audio(audioURL);
//         // audioElement = new Audio(audioURL);
//         audioElement.controls = true;
//         audioContainer.innerHTML = '';
//         audioContainer.appendChild(audioElement);
//     }

//     const tabId = activeTab.id ? activeTab.id : 'dictation';

//     const tabAudioData = window.tabAudioData || {};
//     tabAudioData[tabId] = { audioBlob, transcriptionText };
//     window.tabAudioData = tabAudioData;

//     // tabAudioData[tabId] = {
//     //     audioBlob,
//     //     transcriptionText
//     // };
// }

// function insertTranscriptionIntoActiveTab(transcriptionText, audioBlob) {
//     //const activeTab = document.querySelector('.tab-content.active');

//     const activeTab = document.querySelector('.tab-content'); // only one
//     const activeTabId = activeTab ? activeTab.id : null;

//     const sectionName = window.selectedSection || 'dictation';

//     if (!activeTabId) {
//         console.warn("No active tab found.");
//         return;
//     }

//     // Get which section we're in
//     //const sectionName = activeTabId.replace("tab-", ""); // e.g., "tab-introduction" -> "introduction"

//     // Insert transcription into correct field
//     if (sectionName === "header") {
//         // If backend returns structured JSON for header, parse it
//         try {
//             const headerData = JSON.parse(transcriptionText);
//             console.log("Parsed header JSON:", headerData);

//             const titleEl = activeTab.querySelector("#paper-title");
//             if (titleEl && headerData.title) titleEl.value = headerData.title;

//             const authorEl = activeTab.querySelector("#paper-authors");
//             if (authorEl && headerData.authors) authorEl.value = headerData.authors;

//             const profEl = activeTab.querySelector("#paper-professor");
//             if (profEl && headerData.professor) profEl.value = headerData.professor;

//             const deptEl = activeTab.querySelector("#paper-department");
//             if (deptEl && headerData.department) deptEl.value = headerData.department;

//             const uniEl = activeTab.querySelector("#paper-university");
//             if (uniEl && headerData.university) uniEl.value = headerData.university;

//         } catch (err) {
//             console.warn("Header transcription was not valid JSON. Inserting raw:");
//             const textarea = activeTab.querySelector("textarea");
//             if (textarea) textarea.value = transcriptionText;
//         }
//     } else {
//         // For other sections like introduction, body, etc.
//         //const textarea = activeTab.querySelector("textarea");
//         const textarea = activeTab.querySelector(`[name="${sectionName}"], [id="${sectionName}"]`);
//         if (textarea) {
//             textarea.value = transcriptionText;
//         } else {
//             console.warn(`Textarea not found in tab ${activeTabId}`);
//         }
//     }

//     // Optional: also show audio playback in tab
//     const audioContainer = activeTab.querySelector('.tab-audio');
//     if (audioBlob && audioContainer) {
//         const audioURL = URL.createObjectURL(audioBlob);
//         const audioElement = new Audio(audioURL);
//         audioElement.controls = true;
//         audioContainer.innerHTML = '';
//         audioContainer.appendChild(audioElement);
//     }

//     // Store in tabAudioData for future use
//     if (!window.tabAudioData) window.tabAudioData = {};
//     window.tabAudioData[activeTabId] = { audioBlob, transcriptionText };
// }

function insertTranscriptionIntoActiveTab(transcriptionText, audioBlob) {

    const activeTab = document.querySelector('.tab-content.active') || document.querySelector('.tab-content');
    if (!activeTab) {
        console.warn("No active tab found.");
        return;
    }

    const sectionName = window.selectedSection || activeTab.dataset.section || 'dictation';
    console.log("Transcribing into section:", sectionName);
    console.log("Received transcription:", transcriptionText);

    console.log("=== INSERTING TRANSCRIPTION ===");
    console.log("Active tab:", activeTab?.id);
    console.log("Section name:", sectionName);
    console.log("Full transcription text:", transcriptionText);

    if (sectionName.toLowerCase() === 'header') {
        console.log("Raw transcriptionText for header:", transcriptionText);

        let parsedData = null;
        try {
            parsedData = JSON.parse(transcriptionText);
        } catch (err) {
            console.warn("Failed to parse header transcription as JSON:", err);
        }
    
        if (parsedData && typeof parsedData === 'object') {
            Object.entries(parsedData).forEach(([key, value]) => {
                const normalizedKey = key.toLowerCase().replace(/\s+/g, '-');
                const selector = `[name="${key}"], [name="${normalizedKey}"]`;
                let inputEl = activeTab.querySelector(selector);
    
                if (!inputEl) {
                    console.warn(`No input found for key "${key}" (${selector})`);
                } else {
                    inputEl.value = value;
                    console.log(`Inserted into "${normalizedKey}": ${value}`);
                }
            });
            return;
        }
    
        // fallback: insert raw text into a textarea if JSON parsing failed
        let textarea = activeTab.querySelector('textarea');
        if (!textarea) {
            textarea = document.createElement('textarea');
            activeTab.appendChild(textarea);
        }
        textarea.value = transcriptionText;
        return;
    } 


    // Non-header sections (e.g., Introduction, Conclusion)
    let textField = activeTab.querySelector('textarea, input[type="text"]');
    if (!textField) {
        textField = document.createElement('textarea');
        activeTab.appendChild(textField);
    }
    textField.value = transcriptionText;

    // Optional audio playback UI
    const audioContainer = activeTab.querySelector('.tab-audio');
    if (audioBlob && audioContainer) {
        const audioURL = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioURL);
        audioElement.controls = true;
        audioContainer.innerHTML = '';
        audioContainer.appendChild(audioElement);
    }

    // Save audio data globally
    if (!window.tabAudioData) window.tabAudioData = {};
    if (activeTab.id) window.tabAudioData[activeTab.id] = { audioBlob, transcriptionText };
}



// ------------ Transcribe Audio Func ----------------
// async function transcribeAudio() {
//     const tabAudioData = window.tabAudioData || {};

//     let activeTab = document.querySelector('.tab-content.active');
//     const activeTabId = activeTab ? activeTab.id : 'dictation';

//     if (!activeTab) {
//         activeTab = document; // when on dictation page use textbox
//     }

//     //const audioBlob = tabAudioData[activeTabId]?.audioBlob;
//     //const audioBlob = activeTabId ? tabAudioData[activeTabId]?.audioBlob : recordedBlob;
//     const audioBlob = tabAudioData[activeTabId]?.audioBlob || recordedBlob;
    
//     //if (!activeAudioBlob) {

//     if(!audioBlob) {
//         alert("No audio available");
//         speak("No audio to transcribe! Please record or upload an audio.");
//         return;
//     }

//     //const audioBlob = activeAudioBlob;
//     const filename = "audio_input.webm"
//     speak("Transcribing audio.....")
//     waitingSound.loop = true; // loop waiting sound until done
//     waitingSound.play();

//     const progressBarContainer = document.getElementById("myProgressBar-transcribe");
//     const progressBar = progressBarContainer.querySelector(".bar");
//     let width = 0;

//     // progress bar
//     progressBarContainer.style.display = "block";
//     transcribeBtn.disabled = true;

//     const interval = setInterval(() => {
//         if (width >= 100) {
//             clearInterval(interval);
//             transcribeBtn.disabled = false;
//         } else {
//             width++;
//             progressBar.style.width = width + "%";
//         }
//     }, 80); // update every 50ms 

//     // get section name for backend
//     // let sectionName = 'dictation';
//     // if (activeTabId.startsWith('tab-')) {
//     //     sectionName = activeTabId.replace('tab-', '');
//     // }

//     //let sectionName = window.selectedSection || 'dictation';

//     let sectionName = window.selectedSection || window.defaultSectionForTab || 'dictation';
//     // get selected style (from dropdown on paper)
//     //const styleSelect = document.querySelector('#styleSelect');
//     //const selectedStyle = activeTab.dataset?.style || 'academic-paper';
//     const selectedStyle = window.selectedStyle || 'academic-paper';

//     console.log("Sending style:", selectedStyle);
//     console.log("Sending section:", sectionName);

//     // prepare for backend
//     const formData = new FormData();
//     formData.append("file", audioBlob, filename);
//     formData.append("section", sectionName);
//     formData.append("style", selectedStyle);

//     console.log("Sending style:", selectedStyle);


//     // show audio preview
//     const audioURL = URL.createObjectURL(audioBlob);
//     const audioElement = new Audio(audioURL);
//     audioElement.controls = true;

//     // display in container
//     const audioContainer = document.querySelector("#audio-container");
//     if (audioContainer) {
//         audioContainer.innerHTML = "";
//         audioContainer.appendChild(audioElement);
//     } else {
//         console.warn("#audio-container element nto found!");
//     }

//     // call backend to transcribe audio
//     console.log("Transcribing section:", sectionName);

//     try {
//         const response = await fetch("http://localhost:8000/transcribe/full", {
//             method: "POST",
//             body: formData
//         });
//         console.log(response);

//         if (!response.ok) {
//             throw new Error(`Server error: ${response.status} ${response.statusText}`);
//         }

//         // const data = await response.json();
//         // console.log(data);
//         // const transcriptionData = data.transcription;

//         // Insert transcription into the correct input
//         // const activeTabContent = document.querySelector('.tab-content.active');
//         // const fieldSelector = `[name="${CSS.escape(sectionName)}"]`; // e.g. Header[Title]
//         // const inputField = activeTabContent?.querySelector(fieldSelector);
//         const data = await response.json();
//         const sections = data.sections || {};

//         for (const [sectionKey, content] of Object.entries(sections)) {
//             if (sectionKey.toLowerCase() === "header" && typeof content === "object") {
//                 for (const [field, value] of Object.entries(content)) {
//                     const inputEl = activeTab.querySelector(`[name="${field.toLowerCase()}"]`);
//                     if (inputEl) {
//                         inputEl.value = value;
//                     } else {
//                         console.warn(`No input found for header field: ${field}`);
//                     }
//                 }
//             } else {
//                 const inputField = activeTab.querySelector(`[name="${sectionKey.toLowerCase()}"]`);
//                 if (inputField) {
//                     inputField.value = content;
//                 } else {
//                     console.warn(`No input found for section: ${sectionKey}`);
//                 }
//             }
//         }

//         // if (inputField) {
//         //     inputField.value = transcriptionText;
//         //     console.log("Transcription inserted into:", inputField.name);
//         // } else {
//         //     console.warn("No input field found for section:", sectionName);
//         // }
//         //document.querySelector("#transcription-box").value = data.transcription;

//         if (typeof transcriptionData === 'object') {
//             // backend returned structured data — insert into matching fields
//             for (const key in transcriptionData) {
//                 const value = transcriptionData[key];
//                 const normalizedKey = key.toLowerCase().replace(/\s+/g, '-');
    
//                 const inputField = activeTab.querySelector(`[name="${key}"], [name="${normalizedKey}"]`);
//                 if (inputField) {
//                     inputField.value = value;
//                     console.log(`Inserted "${value}" into ${key}`);
//                 } else {
//                     console.warn(`No field found for key "${key}"`);
//                 }
//             }
//         } else {
//             // fallback: regular string transcription
//             insertTranscriptionIntoActiveTab(transcriptionData, audioBlob);
//         }

//         // insertTranscriptionIntoActiveTab(data.transcription, audioBlob);
//         //const activeTab = document.querySelector('.tab-content.active').id;
        
//         // update stored audio
//         tabAudioData[activeTabId] = {
//             ...tabAudioData[activeTabId],
//             audioBlob: audioBlob
//         };

//         //insertTranscriptionIntoActiveTab(transcriptionText, audioBlob);
        
//     } catch (err) {
//         console.error("Transcription error:", err);
//         alert("Something went wrong while transcribing.")
//     } finally {
//         // stop progress bar
//         clearInterval(interval);
//         progressBar.style.width = "100%";
//         progressBarContainer.style.display = "none";
//         transcribeBtn.disabled = false;

//         waitingSound.pause();
//         waitingSound.loop = false;
//         waitingSound.currentTime = 0;

//         speak("Transcription Finished!")
//         speak("To hear your transcription press 1.")
//     }
// }

async function transcribeAudio() {
    const tabAudioData = window.tabAudioData || {};

    let activeTab = document.querySelector('.tab-content.active');
    const activeTabId = activeTab ? activeTab.id : 'dictation';

    if (!activeTab) {
        activeTab = document; // fallback to document if no active tab
    }

    const audioBlob = tabAudioData[activeTabId]?.audioBlob || recordedBlob;

    if (!audioBlob) {
        alert("No audio available");
        speak("No audio to transcribe! Please record or upload an audio.");
        return;
    }

    const filename = "audio_input.webm";
    speak("Transcribing audio.....");
    waitingSound.loop = true;
    waitingSound.play();

    const progressBarContainer = document.getElementById("myProgressBar-transcribe");
    const progressBar = progressBarContainer.querySelector(".bar");
    let width = 0;

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
    }, 80);

    const sectionName = window.selectedSection || window.defaultSectionForTab || 'dictation';
    const selectedStyle = window.selectedStyle || 'academic-paper';

    console.log("Sending style:", selectedStyle);
    console.log("Sending section:", sectionName);

    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    formData.append("section", sectionName);
    formData.append("style", selectedStyle);

    // show audio preview
    const audioURL = URL.createObjectURL(audioBlob);
    const audioElement = new Audio(audioURL);
    audioElement.controls = true;

    const audioContainer = document.querySelector("#audio-container");
    if (audioContainer) {
        audioContainer.innerHTML = "";
        audioContainer.appendChild(audioElement);
    } else {
        console.warn("#audio-container element not found!");
    }

    console.log("Transcribing section:", sectionName);

    try {
        const response = await fetch("http://localhost:8000/transcribe", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const sections = data.sections || {};

        for (const [sectionKey, content] of Object.entries(sections)) {
            if (sectionKey.toLowerCase() === "header" && typeof content === "object") {
                for (const [field, value] of Object.entries(content)) {
                    const inputEl = activeTab.querySelector(`[name="${field.toLowerCase()}"]`);
                    if (inputEl) {
                        inputEl.value = value;
                        console.log(`Inserted header field "${field}" with value: ${value}`);
                    } else {
                        console.warn(`No input found for header field: ${field}`);
                    }
                }
            } else {
                const inputField = activeTab.querySelector(`[name="${sectionKey.toLowerCase()}"]`);
                if (inputField) {
                    inputField.value = content;
                    console.log(`Inserted section "${sectionKey}" content.`);
                } else {
                    console.warn(`No input found for section: ${sectionKey}`);
                }
            }
        }

        // Update stored audio for the active tab
        tabAudioData[activeTabId] = {
            ...tabAudioData[activeTabId],
            audioBlob: audioBlob
        };

    } catch (err) {
        console.error("Transcription error:", err);
        alert("Something went wrong while transcribing.");
    } finally {
        clearInterval(interval);
        progressBar.style.width = "100%";
        progressBarContainer.style.display = "none";
        transcribeBtn.disabled = false;

        waitingSound.pause();
        waitingSound.loop = false;
        waitingSound.currentTime = 0;

        speak("Transcription Finished!");
        speak("To hear your transcription press 1.");
    }
}


// speak transcription
async function speakTranscription(data) {
    const text = document.querySelector("#transcription-box").value;
    if (text.trim() === "") {
        console.warn("No text to speak");
        speak("No text to edit! To create text, record audio by pressing the, 'r' , key");
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);

    speechSynthesis.speak(utterance);

}

// edit transcription
async function editTranscription(data) {
    const text = document.querySelector("#transcription-box").value;
    if (text.trim() === "") {
        console.warn("No text to speak");
        speak("No text to edit! To create text, record audio by pressing the, 'r' , key");
        return;
    }

    speak("You have entered edit transcription mode.");
    speak("If you would like to use AI to help edit your transcription, press ' 3 '.");
}

// --------------- download pdf function ---------------------
function downloadPDF(textAreaId) {
    const textArea = document.getElementById(textAreaId);
    if (!textArea || !textArea.value.trim()) {
        alert("Text area is empty or not found");
        return;
    }

    document.getElementById("hiddenTextInput").value = textArea.value;
    document.getElementById("pdfForm").submit();
}

// -------------- download paper format pdf ------------------
function downloadPaperPDF(textAreaId) {
    const textArea = document.getElementById(textAreaId);
    if (!textArea || !textArea.value.trim()) {
        alert("Text area is empty or not found");
        return;
    }

    const formData = new FormData();
    formData.append("transcription_text", textArea.value);

    fetch("/paper-format", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "paper_format.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error("Error downloading PDF:", error);
        alert("Failed to generate PDF.");
    });
}

// ------------------ clean text function --------------------
async function cleanText() {
    console.log("Clean button clicked!")

    cleanupWait.loop = true; // loop waiting sound until done
    cleanupWait.play();

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
        cleanupWait.currentTime = 0;
        cleanupWait.pause();
    }
}

// #############################################################################################
// ##                               EVENTS                                                    ##
// #############################################################################################
// ------------- upload audio event ---------------------
// wait until DOM is fully built 
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = [
        document.getElementById("audioFile"),
        document.getElementById("audioFilePaper"),
        document.getElementById("textFile")
    ]

    fileInput.forEach(input => {
        if (input) {
            input.addEventListener("change", uploadAudio);
        }
    });

    //fileInput?.addEventListener("change", uploadAudio);
});

// ------------ Help Menu Event ---------------------
window.addEventListener("keydown", function (event) {
    const activeElem = document.activeElement;
    if (isEditableElement(activeElem)) return;

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

// --------------- Upload Audio Event ----------------
// document.getElementById("audioFile").addEventListener("change", uploadAudio);

// ------------- Play Button ------------- 
// button command
playBtn.addEventListener("click", startRecording);

// keyboard command
window.addEventListener("keydown", async function (event) {
    const activeElem = document.activeElement;
    if (isEditableElement(activeElem)) return;

    if (event.key === "r" || event.key === "R") {
        await startRecording();
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
    const activeElem = document.activeElement;
    if (isEditableElement(activeElem)) return;

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

// ----------------- Speak Transcription -------------------

// keyboard command
window.addEventListener("keydown", async function (event){
    const activeElem = document.activeElement;
    if (isEditableElement(activeElem)) return;

    if (event.key === '1') {
        speakTranscription();

        speak("If there is an error with your transcription, press '2' to edit.")
    }
});

// ------------------ Edit Transcription -----------------

// keyboard command
window.addEventListener("keydown", async function (event){
    const activeElem = document.activeElement;
    if (isEditableElement(activeElem)) return;

    if (event.key === '2') {
        editTranscription();
    }
});

// ----------------------- AI --------------------------
// ai input with dropboxes
document.addEventListener("DOMContentLoaded", () => {
    const aiPromptForm = document.getElementById("ai_prompt");
//document.getElementById("ai_prompt").addEventListener("submit", async function (e) {
    if (aiPromptForm) {
        aiPromptForm.addEventListener("submit", async function (e) { 
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
    }
});

// ---------------- Clean Text Event -----------------------
// ai input with customized prompt
cleanBtn.addEventListener("click", cleanText);



