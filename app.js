const chatDiv = document.getElementById("chat");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Please use Chrome or Edge for voice features.");
}

let recognition = new SpeechRecognition();
recognition.lang = "mr-IN";
recognition.continuous = true;
recognition.interimResults = false;

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "mr-IN";
    window.speechSynthesis.speak(msg);
}

recognition.onresult = async (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    const lowerText = transcript.toLowerCase();

    // 1. Wake Word Check
    if (lowerText.startsWith("aatman") || lowerText.includes("आत्मान")) {
        const cleanInput = transcript.replace(/aatman/gi, "").replace(/आत्मान/gi, "").trim();
        if (cleanInput) executeAatman(cleanInput);
    } 
    // 2. Close Check
    else if (lowerText.includes("over and out") || lowerText.includes("ओव्हर अँड आऊट")) {
        executeAatman("over and out");
    }
};

async function executeAatman(userInput) {
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
        console.error(err);
    }
}

// Keep mic active for hands-free
recognition.onend = () => recognition.start();

function addMessage(sender, msg) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
    chatDiv.appendChild(p);
    // RequestAnimationFrame prevents the "Forced Reflow" violation
    requestAnimationFrame(() => {
        chatDiv.scrollTop = chatDiv.scrollHeight;
    });
}

// Auto-start listening on load
window.onload = () => {
    recognition.start();
    console.log("Listening for 'Aatman'...");
};
