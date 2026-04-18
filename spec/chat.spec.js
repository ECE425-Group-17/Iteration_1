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
          model: 'llama3.2',
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

  it("should use default model when no options.model is provided", async () => {
    await handleChat("Hello");

    const callArgs = global.fetch.calls.mostRecent().args[1];
    const body = JSON.parse(callArgs.body);

    expect(body.model).toBeDefined();
  });

  it("should use provided model from options", async () => {
    await handleChat("Hello", { model: "mistral" });

    const callArgs = global.fetch.calls.mostRecent().args[1];
    const body = JSON.parse(callArgs.body);

    expect(body.model).toBe("mistral");
  });

  it("should send the correct prompt text", async () => {
    await handleChat("Test prompt");

    const callArgs = global.fetch.calls.mostRecent().args[1];
    const body = JSON.parse(callArgs.body);

    expect(body.prompt).toBe("Test prompt");
  });

  it("should throw if response.json fails", async () => {
    global.fetch.and.resolveTo({
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON"))
    });

    await expectAsync(handleChat("Hello")).toBeRejected();
  });

  it("should throw when fetch fails entirely", async () => {
    global.fetch.and.rejectWith(new Error("Network error"));

    await expectAsync(handleChat("Hello")).toBeRejectedWithError(
      /Unable to reach Ollama/
    );
  });

  it("should always send stream: false", async () => {
    await handleChat("Hello");

    const callArgs = global.fetch.calls.mostRecent().args[1];
    const body = JSON.parse(callArgs.body);

    expect(body.stream).toBe(false);
  });
});
