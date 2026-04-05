const { handleChat } = require('../chat.js');

describe("Ollama Chat Logic", () => {
  beforeEach(() => {
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
});