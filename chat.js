async function handleChat(userMessage) {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama',
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
    console.error('---Agent Error---');
    console.error(err.message);
    throw new Error(`Unable to reach Ollama at http://127.0.0.1:11434. ${err.message}`);
  }
}

module.exports = { handleChat };
