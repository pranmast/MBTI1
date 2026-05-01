const chatDiv = document.getElementById("chat");
const micBtn  = document.getElementById("micBtn");

// --- Web Speech API setup ---
// SpeechRecognition is built into Chrome and Edge — no cost, no server needed.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  // Firefox and Safari don't support this — tell the user clearly
  micBtn.disabled = true;
  micBtn.textContent = "⚠️ Use Chrome or Edge";
  addMessage("⚠️", "Your browser doesn't support speech recognition. Please open this in Chrome or Edge.");
}

let recognition;
let isListening = false;

function setupRecognition() {
  recognition = new SpeechRecognition();

  // Change to "mr-IN" if you want Marathi, "hi-IN" for Hindi
  recognition.lang = "hi-IN";

  // Get one final result and stop (not continuous streaming)
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    micBtn.textContent = "🔴 Listening... (tap to stop)";
    micBtn.style.color = "red";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript.trim();
    const confidence = event.results[0][0].confidence;
    console.log(`DEBUG - Transcript: '${transcript}' (confidence: ${confidence.toFixed(2)})`);

    if (!transcript) {
      addMessage("⚠️", "आवाज ऐकू आला नाही. पुन्हा प्रयत्न करा.");
      return;
    }

    addMessage("👤", transcript);
    micBtn.textContent = "⏳ Thinking...";
    micBtn.disabled = true;

    // Send transcript text to server — server only needs to handle LLM now
    try {
      const res = await fetch("https://pranilm-aatman.hf.space/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: transcript }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      addMessage("🤖", data.reply || "...");

    } catch (err) {
      console.error("LLM fetch error:", err);
      addMessage("⚠️", "सर्व्हरशी कनेक्ट होता आले नाही.");
    } finally {
      resetBtn();
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    const messages = {
      "not-allowed":  "Microphone permission denied. Please allow mic access in your browser.",
      "no-speech":    "कोणताही आवाज ऐकू आला नाही. पुन्हा बोला.",
      "network":      "Network error during speech recognition.",
      "aborted":      "Recording stopped.",
    };
    const msg = messages[event.error] || `Speech error: ${event.error}`;
    addMessage("⚠️", msg);
    resetBtn();
  };

  recognition.onend = () => {
    isListening = false;
    // Only reset button if we didn't get a result (onresult handles its own reset)
    if (micBtn.textContent === "🔴 Listening... (tap to stop)") {
      resetBtn();
    }
  };
}

micBtn.onclick = () => {
  if (!SpeechRecognition) return;

  if (isListening) {
    // Tap again to stop early
    recognition.stop();
    return;
  }

  setupRecognition();
  recognition.start();
};

function resetBtn() {
  micBtn.textContent = "🎤 Start Recording";
  micBtn.style.color = "";
  micBtn.disabled = false;
  isListening = false;
}

function addMessage(sender, msg) {
  const p = document.createElement("p");
  p.style.animation = "fadeIn 0.3s ease-in";
  p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
