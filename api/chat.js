async function askAI() {

  const scenario =
    document.getElementById("scenario").value.trim();

  const workflow =
    document.getElementById("workflow").value;

  if (!scenario) {
    alert("Please enter a question first.");
    return;
  }

  const thread =
    document.getElementById("chatThread");

  thread.innerHTML += `
    <div class="thread-message user">
      <div class="thread-avatar">You</div>

      <div class="thread-bubble">
        ${scenario}
      </div>
    </div>
  `;

  thread.innerHTML += `
    <div class="thread-message ai" id="typingBubble">
      <div class="thread-avatar">AI</div>

      <div class="thread-bubble">
        CIH AI is thinking...
      </div>
    </div>
  `;

  thread.scrollTop = thread.scrollHeight;

  document.getElementById("scenario").value = "";

  try {

    const response = await fetch(
      "https://ai.cityinsighthouston.com/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message:
            `Workflow: ${workflow}\nSituation: ${scenario}`
        })
      }
    );

    const data = await response.json();

    const typingBubble =
      document.getElementById("typingBubble");

    if (typingBubble) {
      typingBubble.remove();
    }

    thread.innerHTML += `
      <div class="thread-message ai">
        <div class="thread-avatar">AI</div>

        <div class="thread-bubble">
          ${formatAIResponse(
            data.answer ||
            data.error ||
            "No response returned."
          )}
        </div>
      </div>
    `;

    thread.scrollTop = thread.scrollHeight;

  } catch (error) {

    const typingBubble =
      document.getElementById("typingBubble");

    if (typingBubble) {
      typingBubble.remove();
    }

    thread.innerHTML += `
      <div class="thread-message ai">
        <div class="thread-avatar">AI</div>

        <div class="thread-bubble">
          Connection error.
        </div>
      </div>
    `;

  }

}
