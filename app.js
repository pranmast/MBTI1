const chatDiv = document.getElementById("chat");
const statusDiv = document.getElementById("status");
const micBtn = document.getElementById("micBtn");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();

recognition.lang = "en-US"; // Listens to English/Latin script Marathi
recognition.continuous = true;
recognition.interimResults = true;

let silenceTimer = null;
let isSpeaking = false;

// Function to read the AI response aloud
function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "hi-IN"; // Best engine for Marathi pronunciation
    msg.rate = 1.0;
    msg.onstart = () => { isSpeaking = true; };
    msg.onend = () => { 
        isSpeaking = false;
        recognition.start(); // Resume listening after speaking
    };
    window.speechSynthesis.speak(msg);
}

recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
    }

    const currentText = interimTranscript.toLowerCase().trim();
    statusDiv.textContent = "🟢 Listening: " + currentText;

    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
        if (currentText.length > 0) {
            executeRequest(currentText);
        }
    }, 2500); // Trigger after 2.5s of silence
};

async function executeRequest(userInput) {
    recognition.stop();
    clearTimeout(silenceTimer);
    addMessage("👤", userInput, "user-msg");

    try {
        // Use relative path for Hugging Face Spaces
        const res = await fetch("./run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: userInput }),
        });

        if (!res.ok) throw new Error("Server error");

        const data = await res.json();
        addMessage("🤖", data.reply, "bot-msg");
        speak(data.reply);
    } catch (err) {
        console.error(err);
        addMessage("⚠️", "Connection Error. Space might be busy.", "bot-msg");
        setTimeout(() => recognition.start(), 3000);
    }
}

function addMessage(sender, msg, className) {
    const div = document.createElement("div");
    div.className = `msg ${className}`;
    div.innerHTML = `<strong>${sender}</strong>: ${msg}`;
    chatDiv.appendChild(div);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Start on button click (needed for browser security)
micBtn.onclick = () => {
    recognition.start();
    statusDiv.textContent = "🟢 Listening...";
    micBtn.style.display = "none";
};

recognition.onend = () => {
    if (!isSpeaking) recognition.start();
};
