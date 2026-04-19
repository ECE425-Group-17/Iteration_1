async function runModel(modelName, prompt) {
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      prompt,
      stream: false
    })
  });

  const data = await response.json();
  return data.response;
}

async function handleChat(userMessage) {
  const llama = await runModel("llama3.1", userMessage);
  const mistral = await runModel("mistral", userMessage);
  const gemma = await runModel("gemma3", userMessage);

  return { llama, mistral, gemma };
}

module.exports = { handleChat, runModel };