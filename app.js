const chatDiv = document.getElementById("chat");
const liveStatus = document.createElement("div");
liveStatus.style = "color: #007bff; font-weight: bold; margin-bottom: 10px; font-size: 0.9em; min-height: 1.2em;";
chatDiv.parentNode.insertBefore(liveStatus, chatDiv);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();

recognition.lang = "mr-IN"; 
recognition.continuous = true;
recognition.interimResults = true;

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "mr-IN";
    window.speechSynthesis.speak(msg);
}

recognition.onresult = async (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
    }

    const currentText = interimTranscript.toLowerCase();
    liveStatus.textContent = "Listening: " + interimTranscript;

    // --- TRIGGER DETECTION ---
    // We check for several phonetic variations of 'Aatman'
    const triggers = ["aatman", "aatman", "आत्मान", "आत्मन", "आत्मा"];
    const isTriggered = triggers.some(t => currentText.includes(t));
    
    const isClosing = currentText.includes("over and out") || currentText.includes("ओव्हर अँड आऊट");

    if (isTriggered || isClosing) {
        recognition.stop(); // Stop listening immediately to process
        
        let query = "";
        if (isClosing) {
            query = "over and out";
        } else {
            // Extract everything after the trigger word
            const triggerFound = triggers.find(t => currentText.includes(t));
            query = interimTranscript.split(new RegExp(triggerFound, 'i')).pop().trim();
        }

        if (query) {
            executeAatman(query);
        } else if (!isClosing) {
            speak("हो प्रनील, मी ऐकतोय. बोला?");
            setTimeout(() => recognition.start(), 1000);
        }
    }
};

async function executeAatman(userInput) {
    addMessage("👤", userInput);
    liveStatus.textContent = "Aatman is thinking...";

    try {
        const res = await fetch("https://pranilm-aatman.hf.space/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: userInput }),
        });
        const data = await res.json();
        
        addMessage("🤖", data.reply);
        speak(data.reply);

        // If 'over and out' was called, the server already wiped the memory
        if (userInput.toLowerCase().includes("over and out")) {
            addMessage("🧹", "Memory cleared. Start fresh next time.");
        }

    } catch (err) {
        addMessage("⚠️", "Connection error.");
    } finally {
        // Wait for speech to finish before listening again
        setTimeout(() => {
            if (!window.speechSynthesis.speaking) recognition.start();
        }, 1500);
    }
}

recognition.onend = () => {
    if (!window.speechSynthesis.speaking) recognition.start();
};

function addMessage(sender, msg) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
    chatDiv.appendChild(p);
    requestAnimationFrame(() => { chatDiv.scrollTop = chatDiv.scrollHeight; });
}

window.onload = () => { recognition.start(); };
