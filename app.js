const chatDiv = document.getElementById("chat");

// Record audio using MediaRecorder API
let mediaRecorder;
let audioChunks = [];

document.getElementById("micBtn").onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    audioChunks = [];

    // Send audio to Hugging Face Space /speech endpoint
    const formData = new FormData();
    formData.append("file", audioBlob, "speech.wav");

    const res = await fetch("https://your-space-url/speech", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    const transcript = data.transcript;

    addMessage("👤", transcript);

    // Send transcript to chatbot /run endpoint
    const chatRes = await fetch("https://your-space-url/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: transcript })
    });
    const chatData = await chatRes.json();
    addMessage("🤖", chatData.reply);
  };

  mediaRecorder.start();

  // Stop recording after 5 seconds (adjust as needed)
  setTimeout(() => {
    mediaRecorder.stop();
  }, 5000);
};

function addMessage(sender, msg) {
  const p = document.createElement("p");
  p.textContent = `${sender}: ${msg}`;
  chatDiv.appendChild(p);
}
