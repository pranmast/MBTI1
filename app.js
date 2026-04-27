const chatDiv = document.getElementById("chat");
let mediaRecorder;
let audioChunks = [];

document.getElementById("micBtn").onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    // UI Feedback: Show the user we are listening
    document.getElementById("micBtn").textContent = "🛑 Recording...";

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      document.getElementById("micBtn").textContent = "⏳ Processing...";
      
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      audioChunks = [];

      const formData = new FormData();
      formData.append("file", audioBlob, "speech.wav");

      try {
        // --- STEP 1: SPEECH TO TEXT ---
        const res = await fetch("https://pranilm-aatman.hf.space/speech", {
          method: "POST",
          body: formData
        });

        if (!res.ok) throw new Error(`STT Endpoint Error: ${res.status}`);

        const data = await res.json();
        const transcript = data.transcript || data.text; // Support 'text' or 'transcript' keys

        if (!transcript) throw new Error("No transcript received");
        addMessage("👤", transcript);

        // --- STEP 2: CHATBOT RESPONSE ---
        const chatRes = await fetch("https://pranilm-aatman.hf.space/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: transcript })
        });

        if (!chatRes.ok) throw new Error(`Chat Endpoint Error: ${chatRes.status}`);

        const chatData = await chatRes.json();
        addMessage("🤖", chatData.reply);

      } catch (err) {
        console.error("Pipeline Error:", err);
        addMessage("⚠️", "System error: " + err.message);
      } finally {
        document.getElementById("micBtn").textContent = "🎤 Start Recording";
      }
    };

    mediaRecorder.start();
    setTimeout(() => { if(mediaRecorder.state === "recording") mediaRecorder.stop(); }, 5000);

  } catch (err) {
    console.error("Mic Error:", err);
    alert("Could not access microphone. Check permissions!");
  }
};

function addMessage(sender, msg) {
  const p = document.createElement("p");
  // Optional: Add a little style to differentiate
  p.style.margin = "8px 0";
  p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight; // Auto-scroll to bottom
}
