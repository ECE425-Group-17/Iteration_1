const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';
const DEFAULT_MODELS = ['llama3:8b', 'gemma4:e4b', 'phi3'];

async function fetchModelResponse(userMessage, model) {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: userMessage,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      model,
      reply: data.response
    };
  } catch (err) {
    console.error('Error');
    console.error(err.message);
    throw new Error(`Unable to reach Ollama at http://127.0.0.1:11434. ${err.message}`);
  }
}

async function handleChat(userMessage) {
  return Promise.all(DEFAULT_MODELS.map(model => fetchModelResponse(userMessage, model)));
}

async function regenerateChat(userMessage, model) {
  return fetchModelResponse(userMessage, model);
}

module.exports = {
  DEFAULT_MODELS,
  handleChat,
  regenerateChat
};
