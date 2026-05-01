const chatDiv = document.getElementById("chat");
const micBtn  = document.getElementById("micBtn");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let isListening = false;

// --- Text to Speech Function ---
function speak(text) {
  window.speechSynthesis.cancel(); // Stop any current speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "mr-IN"; // Set voice to Marathi
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

if (!SpeechRecognition) {
  micBtn.disabled = true;
  addMessage("⚠️", "तुमचा ब्राउझर समर्थित नाही.");
}

function setupRecognition() {
  const recognition = new SpeechRecognition();
  recognition.lang = "mr-IN"; 
  recognition.onstart = () => {
    isListening = true;
    micBtn.textContent = "🔴 ऐकत आहे...";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    addMessage("👤", transcript);
    micBtn.textContent = "⏳ शोधत आहे...";

    try {
      const res = await fetch("https://pranilm-aatman.hf.space/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: transcript }),
      });
      
      const data = await res.json();
      const reply = data.reply;
      
      addMessage("🤖", reply);
      speak(reply); // Trigger Voice Output

    } catch (err) {
      addMessage("⚠️", "त्रुटी आली.");
    } finally {
      resetBtn();
    }
  };

  recognition.onerror = () => resetBtn();
  recognition.onend = () => resetBtn();
  recognition.start();
}

micBtn.onclick = () => {
  if (isListening) return;
  setupRecognition();
};

function resetBtn() {
  isListening = false;
  micBtn.textContent = "🎤 बोला";
}

function addMessage(sender, msg) {
  const p = document.createElement("p");
  p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
