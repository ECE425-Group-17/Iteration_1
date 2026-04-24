const MODELS = ["gemma3:1b", "gemma3:27b", "gpt-oss:20b"];

async function generateWithModel(model, userMessage) {
  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      prompt: userMessage,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`${model} failed: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

async function handleMultiChat(userMessage) {
  const results = await Promise.all(
    MODELS.map(async model => {
      try {
        const response = await generateWithModel(model, userMessage);
        return [model, response];
      } catch (err) {
        return [model, `Error from ${model}: ${err.message}`];
      }
    })
  );

  return Object.fromEntries(results);
}

async function regenerateResponse(model, userMessage) {
  if (!MODELS.includes(model)) {
    throw new Error("Invalid model selected.");
  }

  return generateWithModel(model, userMessage);
}

module.exports = {
  MODELS,
  generateWithModel,
  handleMultiChat,
  regenerateResponse
};