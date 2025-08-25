// Frontend Java for create paper tab

//const tabAudioData = window.tabAudioData;

// window.setupTabs = function setupTabs() {
//     const tabButtons = document.querySelectorAll('.tab-btn');
//     const tabContents = document.querySelectorAll('.tab-content');

//     tabButtons.forEach(button => {
//         button.addEventListener('click', () => {
//             const targetId = button.getAttribute('data-tab');

//             tabButtons.forEach(btn => btn.classList.remove('active'));
//             tabContents.forEach(tab =>tab.classList.remove('active'));

//             button.classList.add('active');
//             document.getElementById(targetId).classList.add('active');
//         });
//     });
// };


window.setupTabs = function setupTabs(formats) {
    const tabButtons = document.querySelectorAll('.tab-btn');

    //tabButtons.forEach((button, index) => {
    tabButtons.forEach(button => {

        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            //const selectedFormat = formats.find(f => f.name.toLowerCase() === targetId);
            const selectedFormat = formats.find(f => f.name.toLowerCase().replace(/\s+/g, '-') === targetId);
            if (selectedFormat) {
                // store selected style globally
                // window.selectedStyle = selectedFormat.name.toLowerCase();
                //window.selectedStyle = selectedFormat.name.toLowerCase().replace(/\s+/g, '-');
                window.selectedStyle = selectedFormat.id;
                window.selectedTabId = targetId;

                loadSections(selectedFormat);
            }
        });
    });
};

// function downloadPaperPDF(textAreaId) {
//     const abstract = document.getElementById("transcription-box-abstract").value.trim();
//     const intro = document.getElementById("transcription-box-intro").value.trim();
//     const body = document.getElementById("transcription-box-body").value.trim();
//     const conclusion = document.getElementById("transcription-box-conclusion").value.trim();

//     if (!abstract && !intro && !body && !conclusion) {
//         alert("All fields are empty!");
//         return;
//     }

//     // const textArea = document.getElementById(textAreaId);
//     // if (!textArea || !textArea.value.trim()) {
//     //     alert("Text area is empty or not found");
//     //     return;
//     // }

//     const formData = new FormData();
//     formData.append("abstract", abstract);
//     formData.append("introduction", intro);
//     formData.append("body", body);
//     formData.append("conclusion", conclusion);


//     fetch("/paper-format", {
//         method: "POST",
//         body: formData
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error("Network response was not ok");
//         }
//         return response.blob();
//     })
//     .then(blob => {
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "paper_format.pdf";
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         window.URL.revokeObjectURL(url);
//     })
//     .catch(error => {
//         console.error("Error downloading PDF:", error);
//         alert("Failed to generate PDF.");
//     });
// }
function submitPaperPDF() {
    const form = document.getElementById("pdfForm");
    const formData = new FormData(form);

    if (window.selectedStyle) {
        formData.append("style", window.selectedStyle);
    } else {
        alert("Please select a paper format first.")
        return;
    }

    fetch("/paper", { // paper-format ==> paper
        method: "POST",
        body: formData
    })
    //.then(res => res.blob())
    .then(res => { //added
        if (!res.ok) throw new Error("Network response was not ok");
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "paper_format.pdf";
        a.click();
        window.URL.revokeObjectURL(url); // added
    })
    .catch(err => {
        console.error("PDF generation failed:", err);
        alert("Error generating PDF");
    });
}

function downloadPaperPDF() {
    const sections = document.querySelectorAll(".tab-content");
    const formData = new FormData();

    sections.forEach(section => {
        // ADDED
        // For each section, gather all inputs and textareas
        const inputs = section.querySelectorAll("input, textarea");
        inputs.forEach(input => {
            if (input.name) {
                formData.append(input.name, input.value);
            }
        });
    });

    // const style = document.querySelector("#styleSelect").value;
    // formData.append("style", style);

    //const styleSelect = document.querySelector("#styleSelect");
    if (window.selectedStyle) {
        formData.append("style", window.selectedStyle);
    } else {
        alert("Please select a paper format first.")
        return;
    }

    console.log("Submitting style:", window.selectedStyle);
    
    for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    fetch("/paper", {
        method: "POST",
        body: formData
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "paper_format.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error("Download error:", error);
        alert("Failed to generate PDF.");
    });
}

// function loadSections(format) {
//     const tabContentContainer = document.querySelector(".tab-container");
//     tabContentContainer.innerHTML = "";

//     const div = document.createElement("div");
//     div.className = "tab-content active"; // Always one tab-content div
//     div.id = format.name.toLowerCase();

//     (format.section || []).forEach(section => {
//         if (typeof section === "string") {
//             const label = document.createElement("label");
//             label.textContent = section;
//             label.htmlFor = section.toLowerCase();
//             label.classList.add("main-section-label");
//             div.appendChild(label);

//             const textarea = document.createElement("textarea");
//             textarea.placeholder = `Write your ${section.toLowerCase()} here...`;
//             textarea.name = section.toLowerCase();
//             textarea.id = section.toLowerCase();
//             div.appendChild(textarea);

//         } else if (typeof section === "object") {
//             const groupName = Object.keys(section)[0];
//             const fields = section[groupName];

//             const groupHeader = document.createElement("h3");
//             groupHeader.textContent = groupName;
//             div.appendChild(groupHeader);

//             //const groupHeader = document.createElement("h3");
//             groupHeader.textContent = groupName;
//             if (groupName.toLowerCase() === "header") {
//                 groupHeader.classList.add("header-group-title");
//             }
//             div.appendChild(groupHeader);

//             fields.forEach(field => {
//                 const fieldWrapper = document.createElement("div");
//                 fieldWrapper.classList.add("field-wrapper");

//                 const label = document.createElement("label");
//                 const groupHeader = document.createElement("h3");
//                 groupHeader.textContent = groupName;

//                 label.textContent = field;
//                 label.htmlFor = field.toLowerCase().replace(/\s+/g, '-');
//                 div.appendChild(label);

//                 let inputEl;
//                 if (groupName.toLowerCase() === "header") {
//                     label.classList.add("header-label")
//                     inputEl = document.createElement("input");
//                     inputEl.type = "text";
//                     inputEl.classList.add("header-textarea");
//                     inputEl.placeholder = `Enter ${field}`;
//                 } else {
//                     inputEl = document.createElement("textarea");
//                     inputEl.placeholder = `Write your ${field.toLowerCase()} here...`;
//                 }

//                 inputEl.name = field.toLowerCase().replace(/\s+/g, '-');
//                 inputEl.id = field.toLowerCase().replace(/\s+/g, '-');
                
//                 fieldWrapper.appendChild(label);
//                 fieldWrapper.appendChild(inputEl);

//                 div.appendChild(fieldWrapper);

//                 // const textarea = document.createElement("textarea");
//                 // textarea.placeholder = `Write your ${field.toLowerCase()} here...`;
//                 // textarea.name = field.toLowerCase().replace(/\s+/g, '-');
//                 // textarea.id = field.toLowerCase().replace(/\s+/g, '-');
                
//                 // // apply special CSS to header text boxes
//                 // if (groupName.toLowerCase() === "header") {
//                 //     textarea.classList.add("header-textarea");
//                 //     console.log("applying header-textarea to:", field);
//                 // }

//                 // div.appendChild(textarea);
//             });
//         }
//     });

//     tabContentContainer.appendChild(div);
// }
function loadSections(format) {
    const container = document.querySelector(".tab-container");
    container.innerHTML = ""; // Clear current content

    const tabContent = document.createElement("div");
    tabContent.className = "tab-content active";
    tabContent.id = `tab-${format.id}`;
    tabContent.dataset.style = format.id;
    container.appendChild(tabContent);

    format.section.forEach(sectionItem => {
        if (typeof sectionItem === "object" && sectionItem.Header) {
            const sectionDiv = document.createElement("div");
            sectionDiv.classList.add("section", "header-section");

            const headerTitle = document.createElement("h3");
            headerTitle.textContent = "Header";
            sectionDiv.appendChild(headerTitle);

            sectionItem.Header.forEach(fieldName => {
                const normalizedName = fieldName.toLowerCase().replace(/\s+/g, '-');

                const group = document.createElement("div");
                group.classList.add("form-group");

                const label = document.createElement("label");
                label.textContent = fieldName;
                label.htmlFor = normalizedName;

                const input = document.createElement("input");
                input.type = "text";
                input.name = normalizedName;
                input.id = normalizedName;
                input.placeholder = `Enter ${fieldName}`;
                
                // ✅ Add focus listener to update selected section
                input.addEventListener("focus", () => {
                    window.selectedSection = 'header'; // special case
                    console.log("User selected HEADER field:", normalizedName);
                });

                group.appendChild(label);
                group.appendChild(input);
                sectionDiv.appendChild(group);
            });

            tabContent.appendChild(sectionDiv);
        } else if (typeof sectionItem === "string") {
            const sectionName = sectionItem;
            const normalizedName = sectionName.toLowerCase();

            const sectionDiv = document.createElement("div");
            sectionDiv.classList.add("section");

            window.selectedSection = normalizedName;
            console.log("Default selectedSection set to:", window.selectedSection);

            const label = document.createElement("label");
            label.textContent = sectionName;
            label.htmlFor = normalizedName;

            const textarea = document.createElement("textarea");
            textarea.name = normalizedName;
            textarea.id = normalizedName;
            textarea.placeholder = `Write your ${sectionName.toLowerCase()} here...`;

            // ✅ Add focus listener
            textarea.addEventListener("focus", () => {
                window.selectedSection = normalizedName;
                console.log("User selected section:", normalizedName);
            });

            sectionDiv.appendChild(label);
            sectionDiv.appendChild(textarea);
            tabContent.appendChild(sectionDiv);
        }
    });
}


// function loadSections(format) {
//     const tabContentContainer = document.querySelector(".tab-container");
//     tabContentContainer.innerHTML = "";

//     let defaultSection = null;

//     const div = document.createElement("div");
//     div.className = "tab-content active"; // Always one tab-content div
//     div.id = format.name.toLowerCase().replace(/\s+/g, '-');
//     div.dataset.style = format.id;

//     (format.section|| []).forEach(section => {
//         if (typeof section === "string") {
//             const label = document.createElement("label");
//             label.textContent = section;
//             label.htmlFor = section.toLowerCase();
//             label.classList.add("main-section-label");
//             div.appendChild(label);

//             const textarea = document.createElement("textarea");
//             textarea.placeholder = `Write your ${section.toLowerCase()} here...`;
//             //textarea.name = section.toLowerCase();
//             textarea.name = section;
//             textarea.id = section.toLowerCase();
//             div.appendChild(textarea);

//         } else if (typeof section === "object") {
//             const groupName = Object.keys(section)[0];
//             const fields = section[groupName];

//             const groupHeader = document.createElement("h3");
//             groupHeader.textContent = groupName;
//             if (groupName.toLowerCase() === "header") {
//                 groupHeader.classList.add("header-group-title");
//             }
//             div.appendChild(groupHeader);

//             fields.forEach(field => {
//                 const fieldWrapper = document.createElement("div");
//                 fieldWrapper.classList.add("field-wrapper");

//                 const label = document.createElement("label");
//                 label.textContent = field;
//                 label.htmlFor = field.toLowerCase().replace(/\s+/g, '-');

//                 let inputEl;
//                 if (groupName.toLowerCase() === "header") {
//                     label.classList.add("header-label");
//                     inputEl = document.createElement("input");
//                     inputEl.type = "text";
//                     inputEl.classList.add("header-textarea");
//                     inputEl.placeholder = `Enter ${field}`;
//                 } else {
//                     inputEl = document.createElement("textarea");
//                     inputEl.placeholder = `Write your ${field.toLowerCase()} here...`;
//                 }

//                 inputEl.name = field;
//                 //inputEl.name = field.toLowerCase().replace(/\s+/g, '-');
//                 inputEl.id = field.toLowerCase().replace(/\s+/g, '-');

//                 fieldWrapper.appendChild(label);
//                 fieldWrapper.appendChild(inputEl);

//                 div.appendChild(fieldWrapper);

//                 if (!defaultSection) defaultSection = inputEl.name;
//                 window.defaultSectionForTab = defaultSection;
//                 window.selectedSection = defaultSection;
//             });
//         }
//     });

//     div.querySelectorAll("textarea, input").forEach(field => {
//         field.addEventListener("focus", () => {
//             const fieldId = field.name || field.id;
//             if (fieldId) {
//                 window.selectedSection = fieldId;
//                 console.log("Selected section:", window.selectedSection);
//             }
//         });
//     });

//     tabContentContainer.appendChild(div);

//     window.selectedSection = defaultSection;
//     console.log("Default selected section set to:", window.selectedSection);
// }

// call tabs on page load
//document.addEventListener("DOMContentLoaded", setupTabs);

// Function to auto insert transcription into correct tab
// function insertTranscriptionIntoActiveTab(transcriptionText, audioBlob) {
//     const activeTab = document.querySelector('.tab-content.active');
//     if(!activeTab) return;

//     const tabId = activeTab.id
//     const textArea = activeTab.querySelector('textarea');
    
//     if (textArea) {
//         textArea.value = transcriptionText;
//     }
    
//     const audioContainer = activeTab.querySelector('.tab-audio');

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

//     const tabAudioData = window.tabAudioData || {};
//     tabAudioData[tabId] = { audioBlob, transcriptionText };
//     window.tabAudioData = tabAudioData;

//     // tabAudioData[tabId] = {
//     //     audioBlob,
//     //     transcriptionText
//     // };
// }
document.addEventListener("DOMContentLoaded", async () => {
    const tabButtonsContainer = document.querySelector(".tab-buttons");
    const tabContentContainer = document.querySelector(".tab-container");

    // Fetch all format templates (e.g., academic, report, magazine)
    const res = await fetch(`/templates/formats/`); // <- Your endpoint
    const formats = await res.json();

    console.log("Fetched foramts:", formats);

    // Render format tabs
    formats.forEach((format, idx) => {
        const btn = document.createElement("button");
        btn.className = "tab-btn" + (idx === 0 ? " active" : "");
        btn.dataset.tab = format.name.toLowerCase().replace(/\s+/g, '-');
        btn.textContent = format.name;
        tabButtonsContainer.appendChild(btn);
    });

    // Load first format’s sections initially
    if (formats.length > 0) {
        loadSections(formats[0]);
    }

    setupTabs(formats); // handles tab click and loading
});

function previewPaper() {
    const sections = document.querySelectorAll(".tab-content");
    const formData = new FormData();

    sections.forEach(section => {
        const inputs = section.querySelectorAll("input, textarea");
        inputs.forEach(input => {
            if (input.name) {
                formData.append(input.name, input.value);
            }
        });
    });

    if (window.selectedStyle) {
        formData.append("style", window.selectedStyle);
    } else {
        alert("Please select a paper format first.");
        return;
    }

    fetch("/paper-preview", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        let previewArea = document.getElementById("previewArea");
        if (!previewArea) {
            previewArea = document.createElement("div");
            previewArea.id = "previewArea";
            previewArea.style.border = "1px solid #ccc";
            previewArea.style.padding = "15px";
            previewArea.style.marginTop = "20px";
            document.body.appendChild(previewArea);
        }

        previewArea.innerHTML = "<h2>Paper Preview</h2>";

        for (const [key, value] of Object.entries(data)) {
            const section = document.createElement("div");
            section.innerHTML = `<h3>${key}</h3><p>${value}</p>`;
            previewArea.appendChild(section);
        }
    })
    .catch(err => {
        console.error("Preview failed:", err);
        alert("Error generating preview.");
    });
}


// document.addEventListener("DOMContentLoaded", () => {
//     const textUpload = document.getElementById('textFileUpload');
//     if (textUpload) {
//         textUpload.addEventListener('change', function (event) {
//             const file = event.target.files[0];
//             if (!file) return;

//             const reader = new FileReader();
//             reader.onload = function (e) {
//                 const uploadedText = e.target.result;

//                 const activeTextarea = document.querySelector('.tab-content.active textarea');
//                 if (activeTextarea) {
//                     activeTextarea.value = uploadedText;
//                 }
//             };
//             reader.readAsText(file);
//         });
//     } else {
//         console.warn("Element #textFileUpload not found in DOM yet.")
//     }
// });


// dynamically change UI when user selets a different paper style
// document.addEventListener("DOMContentLoaded", () => {
//     const styleSelect = document.getElementById("styleSelect");
//     if (styleSelect) {
//         styleSelect.addEventListener("change", async (e) => {
//             const style = e.target.value;

//             const res = await fetch(`/templates/formats/${style}`);
//             const template = await res.json();

//             const tabButtonsContainer = document.querySelector(".tab-buttons");
//             const tabContentContainer = document.querySelector(".tab-container");

//             console.log(tabButtonsContainer, tabContentContainer);
//             // clear exisiting text boxes
//             tabButtonsContainer.innerHTML = "";
//             tabContentContainer.querySelectorAll(".tab-content").forEach(c => c.remove());

//             // create new text boxes
//             (template.section || []).forEach((section, idx) => {
//                 // const btn = document.createElement("button");
//                 // btn.className = "tab-btn" + (idx === 0 ? " active" : "");
//                 // btn.dataset.tab = section.toLowerCase();
//                 // btn.textContent = section;
//                 // tabButtonsContainer.appendChild(btn);

//                 // const div = document.createElement("div");
//                 // div.className = "tab-content" + (idx === 0 ? " active": "");
//                 // div.id = section.toLowerCase();

//                 // const textarea = document.createElement("textarea");
//                 // textarea.placeholder = `Write your ${section.toLowerCase()} here...`;
//                 // textarea.name = section.toLowerCase();
//                 // div.appendChild(textarea);

//                 // tabContentContainer.appendChild(div);
//                 if (typeof section === "string") {
//                     createTabAndContent(section, idx === 0);
//                 } else if (typeof section === "object") {
//                     const groupName = Object.keys(section)[0];
//                     const fields = section[groupName];

//                     createGroupTabAndContent(groupName, fields, idx === 0);
//                 }
//             });
//             setupTabs();

//             function createTabAndContent(name, isActive) {
//                 const btn = document.createElement("button");
//                 btn.className = "tab-btn" + (isActive ? " active" : "");
//                 btn.dataset.tab = name.toLowerCase();
//                 btn.textContent = name;
//                 tabButtonsContainer.appendChild(btn);
            
//                 const div = document.createElement("div");
//                 div.className = "tab-content" + (isActive ? " active" : "");
//                 div.id = name.toLowerCase();
            
//                 const textarea = document.createElement("textarea");
//                 textarea.placeholder = `Write your ${name.toLowerCase()} here...`;
//                 textarea.name = name.toLowerCase();
            
//                 div.appendChild(textarea);
//                 tabContentContainer.appendChild(div)
//             }
            
//             function createGroupTabAndContent(groupName, fields, isActive) {
//                 const btn = document.createElement("button");
//                 btn.className = "tab-btn" + (isActive ? " active" : "");
//                 btn.dataset.tab = groupName.toLowerCase();
//                 btn.textContent = groupName;
//                 tabButtonsContainer.appendChild(btn);
            
//                 const div = document.createElement("div");
//                 div.className = "tab-content" + (isActive ? " active" : "");
//                 div.id = groupName.toLowerCase();
            
//                 fields.forEach(field => {
//                     const label = document.createElement("label");
//                     label.textContent = field;
//                     label.htmlFor = field.toLowerCase().replace(/\s+/g, '-');
//                     div.appendChild(label);
            
//                     const textarea = document.createElement("textarea");
//                     textarea.placeholder = `Write your ${field.toLowerCase()} here...`;
//                     textarea.name = field.toLowerCase().replace(/\s+/g, '-');
//                     textarea.id = field.toLowerCase().replace(/\s+/g, '-');
//                     div.appendChild(textarea)
//                 });
                
//                 tabContentContainer.appendChild(div);
//             }            
//         });
//     } else {
//         console.error("No element with ID 'styleSelect' found.");
//     }
// });



// ------------------- EVENTS ----------------------------
