const chatDiv = document.getElementById("chat");
let mediaRecorder;
let audioChunks = [];

// ... existing variables ...

document.getElementById("micBtn").onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { sampleRate: 16000, channelCount: 1 } 
    });

    // Use a more generic mimeType if webm fails
    const options = { mimeType: 'audio/webm;codecs=opus' };
    mediaRecorder = new MediaRecorder(stream, options);
    
    audioChunks = []; // Clear previous data

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      // 1. SMALL DELAY: Ensure the last chunk is pushed
      await new Promise(resolve => setTimeout(resolve, 200));

      if (audioChunks.length === 0) {
          addMessage("⚠️", "No audio captured.");
          return;
      }

      // 2. BLOB CREATION
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.webm"); // Use .webm extension

      document.getElementById("micBtn").textContent = "⏳ Thinking...";

      try {
        const res = await fetch("https://pranilm-aatman.hf.space/speech", {
          method: "POST",
          body: formData
        });

        const data = await res.json();
        
        // DEBUG: See what the server actually caught
        console.log("Server Debug:", data);

        if (!data.transcript || data.transcript.trim() === "") {
            throw new Error("Vosk heard nothing. Try holding the mic closer.");
        }
        
        addMessage("👤", data.transcript);

        // ... rest of chatbot logic ...

      } catch (err) {
        addMessage("⚠️", err.message);
      } finally {
        document.getElementById("micBtn").textContent = "🎤 Start Recording";
        stream.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorder.start(100); // Collect data in 100ms chunks for reliability
    
    setTimeout(() => { 
        if(mediaRecorder.state === "recording") mediaRecorder.stop(); 
    }, 4000);

  } catch (err) {
    alert("Mic access error.");
  }
};

function addMessage(sender, msg) {
  const p = document.createElement("p");
  p.style.animation = "fadeIn 0.3s ease-in";
  p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
