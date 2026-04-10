const { handleChat } = require('../chat.js');

describe("Ollama Chat Logic", () => {
  beforeEach(() => {
    spyOn(console, 'error');
    global.fetch = jasmine.createSpy("fetch").and.callFake(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ response: "Mock AI Response" })
      });
    });
  });

  it("should return a response string when Ollama succeeds", async () => {
    const result = await handleChat("Hello");
    expect(result).toBe("Mock AI Response");
    expect(global.fetch).toHaveBeenCalled();
  });

  it("should send the expected payload to Ollama", async () => {
    await handleChat("Hello");

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/generate',
      jasmine.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma4:e4b',
          prompt: 'Hello',
          stream: false
        })
      })
    );
  });

  it("should throw a helpful error when Ollama responds with a bad status", async () => {
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
