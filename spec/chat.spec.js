const { handleChat, regenerateChat, DEFAULT_MODELS } = require('../chat.js');

describe("Ollama Chat Logic", () => {
  beforeEach(() => {
    spyOn(console, 'error');
    global.fetch = jasmine.createSpy("fetch").and.callFake((url, options) => {
      const payload = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ response: `Mock response from ${payload.model}` })
      });
    });
  });

  it("returns one response per configured LLM when compare mode succeeds", async () => {
    const result = await handleChat("Hello");

    expect(result).toEqual([
      { model: DEFAULT_MODELS[0], reply: `Mock response from ${DEFAULT_MODELS[0]}` },
      { model: DEFAULT_MODELS[1], reply: `Mock response from ${DEFAULT_MODELS[1]}` },
      { model: DEFAULT_MODELS[2], reply: `Mock response from ${DEFAULT_MODELS[2]}` }
    ]);
    expect(global.fetch.calls.count()).toBe(DEFAULT_MODELS.length);
  });

  it("sends one request to Ollama for each configured model", async () => {
    await handleChat("Hello");

    DEFAULT_MODELS.forEach((modelName, index) => {
      const call = global.fetch.calls.argsFor(index);
      expect(call[0]).toBe('http://127.0.0.1:11434/api/generate');
      expect(call[1]).toEqual(jasmine.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: 'Hello',
          stream: false
        })
      }));
    });
  });

  it("regenerates a single selected LLM response", async () => {
    const result = await regenerateChat("Hello", DEFAULT_MODELS[1]);

    expect(result).toEqual({
      model: DEFAULT_MODELS[1],
      reply: `Mock response from ${DEFAULT_MODELS[1]}`
    });
    expect(global.fetch.calls.count()).toBe(1);
  });

  it("throws a helpful error when Ollama responds with a bad status", async () => {
    global.fetch.and.resolveTo({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable'
    });

    await expectAsync(handleChat("Hello")).toBeRejectedWithError(
      'Unable to reach Ollama at http://127.0.0.1:11434. Ollama error: 503 Service Unavailable'
    );
  });
});
