const {
  MODELS,
  generateWithModel,
  handleMultiChat,
  regenerateResponse
} = require("../chat.js");

describe("Multi-LLM Chat Logic", () => {
  beforeEach(() => {
    global.fetch = jasmine.createSpy("fetch").and.resolveTo({
      ok: true,
      json: () => Promise.resolve({ response: "Mock AI Response" })
    });
  });

  it("contains three models", () => {
    expect(MODELS.length).toBe(3);
  });

  it("sends the selected model to Ollama", async () => {
    const testModel = MODELS[0];

    await generateWithModel(testModel, "Hello");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:11434/api/generate",
      jasmine.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: testModel,
          prompt: "Hello",
          stream: false
        })
      })
    );
  });

  it("returns responses for all three models", async () => {
    const result = await handleMultiChat("Hello");

    expect(Object.keys(result).length).toBe(3);

    MODELS.forEach(model => {
      expect(result[model]).toBe("Mock AI Response");
    });
  });

  it("regenerates a response for a valid model", async () => {
    const result = await regenerateResponse(MODELS[0], "Hello");
    expect(result).toBe("Mock AI Response");
  });

  it("rejects an invalid model", async () => {
    await expectAsync(
      regenerateResponse("fakeModel", "Hello")
    ).toBeRejectedWithError("Invalid model selected.");
  });
});