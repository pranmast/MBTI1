// Speech capture via Web Speech API (browser side)
const micBtn = document.getElementById("micBtn");
const chatDiv = document.getElementById("chat");

micBtn.onclick = () => {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "mr-IN"; // Marathi locale
  recognition.start();

  recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    addMessage("👤", text);

    // Send to backend (Mistral + search + MBTI)
    const res = await fetch("https://your-space-url/run", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({input: text})
    });
    const data = await res.json();
    addMessage("🤖", data.reply);
  };
};

function addMessage(sender, msg) {
  const p = document.createElement("p");
  p.textContent = `${sender}: ${msg}`;
  chatDiv.appendChild(p);
}
