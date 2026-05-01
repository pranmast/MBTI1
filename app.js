const chatDiv = document.getElementById("chat");
const micBtn = document.getElementById("micBtn");

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// --- MIME TYPE SELECTION ---
// Browsers vary: Chrome supports webm/opus, Safari supports mp4, Firefox supports ogg.
// We pick the first one the current browser actually supports.
function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log("Using mimeType:", type);
      return type;
    }
  }
  console.warn("No preferred mimeType supported — using browser default");
  return ""; // Let the browser decide
}

micBtn.onclick = async () => {
  if (isRecording) return; // Prevent double-clicks

  try {
    // NOTE: Do NOT request sampleRate here — browsers ignore it for MediaRecorder
    // and it can cause getUserMedia to fail on some devices.
    // pydub on the server handles resampling to 16kHz.
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};
    mediaRecorder = new MediaRecorder(stream, options);

    audioChunks = [];
    isRecording = true;
    micBtn.textContent = "🔴 Recording... (tap to stop)";

    mediaRecorder.ondataavailable = (event) => {
      // Only push non-empty chunks
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      micBtn.textContent = "⏳ Thinking...";
      micBtn.disabled = true;

      // onstop already fires after ALL ondataavailable events —
      // no setTimeout needed here
      if (audioChunks.length === 0) {
        addMessage("⚠️", "No audio captured. Check your microphone.");
        resetBtn();
        return;
      }

      // Use the actual mimeType the recorder used (not a hardcoded one)
      const actualType = mediaRecorder.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunks, { type: actualType });

      console.log(`DEBUG - Blob: ${audioBlob.size} bytes, type: ${actualType}`);

      if (audioBlob.size < 1000) {
        addMessage("⚠️", "Recording was too short or silent. Please try again.");
        resetBtn();
        return;
      }

      const formData = new FormData();
      // Give the file the right extension so pydub/ffmpeg can detect the format
      const ext = actualType.includes("ogg") ? "ogg"
                : actualType.includes("mp4") ? "mp4"
                : "webm";
      formData.append("file", audioBlob, `speech.${ext}`);

      try {
        const res = await fetch("https://pranilm-aatman.hf.space/speech", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();
        console.log("Server response:", data);

        if (data.error) {
          throw new Error(`Server: ${data.error}`);
        }

        if (!data.transcript || data.transcript.trim() === "") {
          addMessage("⚠️", "आवाज ऐकू आला नाही. जवळून स्पष्टपणे बोला.");
          resetBtn();
          return;
        }

        addMessage("👤", data.transcript);

        // Send transcript to LLM
        const runRes = await fetch("https://pranilm-aatman.hf.space/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: data.transcript }),
        });
        const runData = await runRes.json();
        addMessage("🤖", runData.reply || "...");

      } catch (err) {
        console.error("Fetch error:", err);
        addMessage("⚠️", err.message);
      } finally {
        resetBtn();
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    // Collect in 250ms chunks — 100ms creates too many tiny chunks
    mediaRecorder.start(250);

    // Auto-stop after 6 seconds
    setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    }, 6000);

  } catch (err) {
    console.error("Mic error:", err);
    isRecording = false;
    if (err.name === "NotAllowedError") {
      alert("Microphone permission denied. Please allow mic access and try again.");
    } else if (err.name === "NotFoundError") {
      alert("No microphone found on this device.");
    } else {
      alert("Mic error: " + err.message);
    }
    resetBtn();
  }
};

function resetBtn() {
  micBtn.textContent = "🎤 Start Recording";
  micBtn.disabled = false;
  isRecording = false;
}

function addMessage(sender, msg) {
  const p = document.createElement("p");
  p.style.animation = "fadeIn 0.3s ease-in";
  p.innerHTML = `<strong>${sender}</strong>: ${msg}`;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
