async function handleChat(userMessage) {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: userMessage,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (err) {
    console.error('Error');
    console.error(err.message);
    throw new Error(`Unable to reach Ollama at http://127.0.0.1:11434. ${err.message}`);
  }
}

async function handleMultiChat(userMessage) {
  if (!userMessage || userMessage.trim() === "") {
    throw new Error("Message cannot be empty");
  }

  const prompts = [
    `Give a simple answer to this question: ${userMessage}`,
    `Give a detailed answer to this question: ${userMessage}`,
    `Give a short beginner-friendly answer to this question: ${userMessage}`
  ];

  const responses = [];

  for (let i = 0; i < prompts.length; i++) {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompts[i],
        stream: false
      })
    });

    const data = await response.json();

    responses.push({
      model: `Response ${i + 1}`,
      answer: data.response
    });
  }

  return responses;
}

module.exports = {
  handleChat,
  handleMultiChat
};

