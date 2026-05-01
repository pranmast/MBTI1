const chatDiv = document.getElementById("chat");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = new SpeechRecognition();
recognition.lang = "mr-IN"; // Set to Marathi
recognition.continuous = true;
recognition.interimResults = true;

let isBotActive = false;

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "mr-IN";
    window.speechSynthesis.speak(utterance);
}

recognition.onresult = async (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
    }
    
    const lowerTranscript = transcript.toLowerCase();

    // Wake word detection
    if (lowerTranscript.includes("aatman") && !isBotActive) {
        isBotActive = true;
        processRequest(transcript.replace(/aatman/gi, "").trim());
    } 
    // Close command
    else if (lowerTranscript.includes("over and out")) {
        processRequest("over and out");
    }
};

async function processRequest(userInput) {
    if (!userInput) return;
    
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

        if (data.action === "stop") {
            isBotActive = false;
            recognition.stop();
        }
    } catch (err) {
        addMessage("⚠️", "Connection error.");
    } finally {
        isBotActive = false;
    }
}

// Keep the microphone alive
recognition.onend = () => {
    recognition.start();
};

// Start listening as soon as page is touched/loaded
window.onload = () => {
    recognition.start();
    addMessage("🤖", "'aatman' म्हणून बोलायला सुरुवात करा...");
};

function addMessage(sender, msg) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
    chatDiv.appendChild(p);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}
