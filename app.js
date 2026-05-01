const chatDiv = document.getElementById("chat");
// Create a live preview element
const liveStatus = document.createElement("div");
liveStatus.style = "color: #888; font-style: italic; margin-bottom: 10px; font-size: 0.9em;";
chatDiv.parentNode.insertBefore(liveStatus, chatDiv);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();

recognition.lang = "mr-IN"; 
recognition.continuous = true;
recognition.interimResults = true; // Crucial for live feedback

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

    // Show what is being recognized in real-time
    liveStatus.textContent = "Listening: " + (interimTranscript || finalTranscript);

    const checkText = (finalTranscript || interimTranscript).toLowerCase();

    // Trigger word detection
    if (checkText.includes("aatman") || checkText.includes("आत्मान")) {
        recognition.stop(); // Stop listening to process[cite: 3]
        const cleanInput = checkText.split(/aatman|आत्मान/i).pop().trim();
        if (cleanInput) {
            executeAatman(cleanInput);
        } else {
            speak("हो प्रनील, बोला?");
            recognition.start();
        }
    }
};

async function executeAatman(userInput) {
    addMessage("👤", userInput);
    liveStatus.textContent = "Thinking...";

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
        addMessage("⚠️", "Connection lost.");
    } finally {
        recognition.start(); // Resume listening[cite: 3]
    }
}

recognition.onend = () => { if (!window.speechSynthesis.speaking) recognition.start(); };

function addMessage(sender, msg) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
    chatDiv.appendChild(p);
    requestAnimationFrame(() => { chatDiv.scrollTop = chatDiv.scrollHeight; });
}

window.onload = () => { recognition.start(); };
