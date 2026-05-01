const chatDiv = document.getElementById("chat");
const liveStatus = document.createElement("div");
liveStatus.style = "color: #007bff; font-weight: bold; margin-bottom: 10px; font-size: 0.9em; min-height: 1.5em;";
chatDiv.parentNode.insertBefore(liveStatus, chatDiv);

const SpeechRecognition = window.Recognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();

recognition.lang = "en-US"; 
recognition.continuous = true;
recognition.interimResults = true;

let silenceTimer = null;

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "hi-IN"; // Set to Hindi/Marathi friendly voice
    window.speechSynthesis.speak(msg);
}

recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
    }

    const currentText = interimTranscript.toLowerCase().trim();
    liveStatus.textContent = "🟢 Listening: " + currentText;

    // SILENCE DETECTION: Wait 3 seconds of total silence before sending
    clearTimeout(silenceTimer); 
    silenceTimer = setTimeout(() => {
        if (currentText.length > 0) {
            executeRequest(currentText);
        }
    }, 3000); 
};

async function executeRequest(userInput) {
    recognition.stop();
    clearTimeout(silenceTimer);
    addMessage("👤", userInput);

    try {
        // Points to your local FastAPI backend
        const res = await fetch("/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: userInput }),
        });
        const data = await res.json();
        addMessage("🤖", data.reply);
        speak(data.reply);
    } catch (err) {
        addMessage("⚠️", "Connection Error. Check if Space is sleeping.");
    } finally {
        // Wait for bot to finish speaking before listening again
        const checkSpeech = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
                clearInterval(checkSpeech);
                recognition.start();
                liveStatus.textContent = "🟢 Listening...";
            }
        }, 500);
    }
}

recognition.onend = () => { if (!window.speechSynthesis.speaking) recognition.start(); };
window.onload = () => { recognition.start(); };

function addMessage(sender, msg) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
    chatDiv.appendChild(p);
    requestAnimationFrame(() => { chatDiv.scrollTop = chatDiv.scrollHeight; });
}
