const chatDiv = document.getElementById("chat");
let mediaRecorder;
let audioChunks = [];

document.getElementById("micBtn").onclick = async () => {
  try {
    // 1. Force 16kHz and Mono for Vosk compatibility
    const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true
        } 
    });

    // 2. Specify mimeType to help the backend identify the stream
    // Many browsers use audio/webm, which Vosk can handle if sent correctly
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    
    document.getElementById("micBtn").textContent = "🛑 Recording...";
    document.getElementById("micBtn").classList.add("recording");

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      document.getElementById("micBtn").textContent = "⏳ Thinking...";
      
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      audioChunks = [];

      const formData = new FormData();
      // Even if recorded as webm, we name it speech.wav so the server 
      // knows it's an audio file
      formData.append("file", audioBlob, "speech.wav");

      try {
        // --- STEP 1: SPEECH TO TEXT ---
        const res = await fetch("https://pranilm-aatman.hf.space/speech", {
          method: "POST",
          body: formData
        });

        if (!res.ok) throw new Error(`STT Endpoint Error: ${res.status}`);

        const data = await res.json();
        const transcript = data.transcript;

        // Check if the transcript is empty (Vosk couldn't hear anything)
        if (!transcript || transcript.trim() === "") {
            throw new Error("I couldn't quite hear that. Try speaking louder!");
        }
        
        addMessage("👤", transcript);

        // --- STEP 2: CHATBOT RESPONSE ---
        const chatRes = await fetch("https://pranilm-aatman.hf.space/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: transcript })
        });

        if (!chatRes.ok) throw new Error(`Chat Error: ${chatRes.status}`);

        const chatData = await chatRes.json();
        addMessage("🤖", chatData.reply);

      } catch (err) {
        console.error("Pipeline Error:", err);
        addMessage("⚠️", err.message);
      } finally {
        document.getElementById("micBtn").textContent = "🎤 Start Recording";
        document.getElementById("micBtn").classList.remove("recording");
        // Stop all audio tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorder.start();
    
    // Stop recording after 4 seconds
    setTimeout(() => { 
        if(mediaRecorder.state === "recording") mediaRecorder.stop(); 
    }, 4000);

  } catch (err) {
    console.error("Mic Error:", err);
    alert("Microphone access denied or not supported.");
  }
};

function addMessage(sender, msg) {
  const p = document.createElement("p");
  p.style.animation = "fadeIn 0.3s ease-in";
  p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
