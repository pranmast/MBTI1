const chatDiv = document.getElementById("chat");

// UI element for live transcript feedback
const liveStatus = document.createElement("div");
liveStatus.style = "color: #888; font-style: italic; margin-bottom: 10px; font-size: 0.9em; min-height: 1.2em;";
chatDiv.parentNode.insertBefore(liveStatus, chatDiv);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();

recognition.lang = "mr-IN"; 
recognition.continuous = true;
recognition.interimResults = true; // Shows what it's hearing live

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "mr-IN";
    window.speechSynthesis.speak(msg);
}

recognition.onresult = async (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }

    // Update the live feedback on screen
    const currentText = (finalTranscript || interimTranscript).toLowerCase();
    liveStatus.textContent = "Listening: " + currentText;

    // Wake word or phrase detection
    if (currentText.includes("aatman") || currentText.includes("आत्मान")) {
        recognition.stop(); 
        
        // Extract the actual query following the wake word
        const query = currentText.split(/aatman|आत्मान/i).pop().trim();
        
        if (query) {
            executeAatman(query);
        } else {
            speak("हो प्रनील, बोला?");
            setTimeout(() => recognition.start(), 1000);
        }
    }
    else if (currentText.includes("over and out") || currentText.includes("ओव्हर अँड आऊट")) {
        recognition.stop();
        executeAatman("over and out");
    }
};

async function executeAatman(userInput) {
    addMessage("👤", userInput);
    liveStatus.textContent = "Processing...";

    try {
        const res = await fetch("https://pranilm-aatman.hf.space/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: userInput }),
        });
        const data = await res.json();
        addMessage("🤖", data.reply);
        speak(data.reply);
    } catch (err) {
        addMessage("⚠️", "Connection error.");
    } finally {
        // Resume listening after a short delay
        setTimeout(() => recognition.start(), 1000);
    }
}

recognition.onend = () => {
    if (!window.speechSynthesis.speaking) {
        recognition.start();
    }
};

function addMessage(sender, msg) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
    chatDiv.appendChild(p);
    requestAnimationFrame(() => { chatDiv.scrollTop = chatDiv.scrollHeight; });
}

window.onload = () => { recognition.start(); };
