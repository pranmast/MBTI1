const chatDiv = document.getElementById("chat");
const liveStatus = document.createElement("div");
liveStatus.style = "color: #28a745; font-weight: bold; margin-bottom: 10px; font-size: 0.9em;";
chatDiv.parentNode.insertBefore(liveStatus, chatDiv);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();

recognition.lang = "en-US"; // Set to English for better trigger detection
recognition.continuous = true;
recognition.interimResults = true;

let isBotActive = false; // "Active Mode" flag

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "mr-IN"; // Bot still speaks Marathi
    window.speechSynthesis.speak(msg);
}

recognition.onresult = async (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
    }

    const liveText = (finalTranscript || interimTranscript).toLowerCase();
    liveStatus.textContent = isBotActive ? "🟢 Active: " + liveText : "⚪ Waiting for 'Zero': " + liveText;

    // 1. WAKE UP LOGIC
    if (!isBotActive && liveText.includes("zero")) {
        isBotActive = true;
        speak("हो प्रनील, मी ऐकतोय. बोला.");
        return;
    }

    // 2. SLEEP / RESET LOGIC
    if (liveText.includes("over and out")) {
        isBotActive = false;
        executeQuery("over and out");
        return;
    }

    // 3. CONTINUOUS PROCESSING (Only when Finalized)
    if (isBotActive && finalTranscript.trim().length > 0) {
        // Prevent the bot from replying to its own wake word
        const cleanInput = finalTranscript.replace(/zero/gi, "").trim();
        if (cleanInput) executeQuery(cleanInput);
    }
};

async function executeQuery(userInput) {
    recognition.stop(); // Stop mic while bot speaks[cite: 3]
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
        addMessage("⚠️", "Error.");
    } finally {
        // Wait for bot to finish speaking before listening again[cite: 3]
        const checkSpeaking = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
                clearInterval(checkSpeaking);
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
