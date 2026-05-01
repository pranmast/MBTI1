const chatDiv = document.getElementById("chat");
const liveStatus = document.createElement("div");
liveStatus.style = "color: #007bff; font-weight: bold; margin-bottom: 10px; font-size: 0.9em; min-height: 1.5em;";
chatDiv.parentNode.insertBefore(liveStatus, chatDiv);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();

recognition.lang = "en-US"; // Keep transcripts in English for easier trigger matching
recognition.continuous = true;
recognition.interimResults = true;

let isBotActive = false;

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "mr-IN"; // Bot responds in Marathi
    window.speechSynthesis.speak(msg);
}

recognition.onresult = async (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
    }

    const currentText = (finalTranscript || interimTranscript).toLowerCase();
    liveStatus.textContent = isBotActive ? "🟢 Active: " + currentText : "⚪ Say 'Zero': " + currentText;

    // 1. WAKE WORD DETECTION (Wait for 'Zero')
    if (!isBotActive && currentText.includes("zero")) {
        isBotActive = true;
        speak("हो प्रनील, बोला."); // "Yes Pranil, speak."
        return;
    }

    // 2. RESET DETECTION
    if (currentText.includes("over and out")) {
        isBotActive = false;
        executeRequest("over and out");
        return;
    }

    // 3. CAPTURE QUERY (When user finishes speaking)
    if (isBotActive && event.results[event.results.length - 1].isFinal) {
        const query = event.results[event.results.length - 1][0].transcript.trim();
        
        // Don't send the wake word itself as a query
        if (query.toLowerCase() !== "zero") {
            executeRequest(query);
        }
    }
};

async function executeRequest(userInput) {
    // Temporarily pause recognition to avoid bot hearing itself
    recognition.stop();
    addMessage("👤", userInput);

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
        addMessage("⚠️", "Connection Error.");
    } finally {
        // Resume listening once speech is done[cite: 3]
        const checkSpeech = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
                clearInterval(checkSpeech);
                recognition.start();
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
