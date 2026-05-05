const { handleChat } = require('../chat.js');

function createGeminiIntentResponse(intent) {
  return Promise.resolve({
    ok: true,
    status: 200,
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    headers: {
      get(header) {
        return header.toLowerCase() === 'content-type' ? 'application/json' : null;
      },
      entries() {
        return [['content-type', 'application/json']][Symbol.iterator]();
      }
    },
    json: () => Promise.resolve({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify(intent)
              }
            ]
          }
        }
      ]
    })
  });
}

describe("Ollama Chat Logic", () => {
  beforeEach(() => {
    spyOn(console, 'error');
    global.fetch = jasmine.createSpy("fetch").and.callFake((url) => {
      if (url.toString().includes('generativelanguage.googleapis.com')) {
        return createGeminiIntentResponse({
          needsSearch: false,
          searchQuery: null,
          isFictional: false
        });
      }

      if (url === 'https://places.googleapis.com/v1/places:searchText') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            places: [
              {
                displayName: { text: "Mock Place" },
                formattedAddress: "123 Test St",
                rating: 4.5,
                googleMapsUri: "https://maps.google.com/?q=Mock+Place"
              }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ response: "Mock AI Response" })
      });
    });
  });

  it("should return a response string when the default Ollama model succeeds", async () => {
    const result = await handleChat("Hello");
    expect(result).toBe("Mock AI Response");
    expect(global.fetch).toHaveBeenCalled();
  });

  it("should retrieve Google Places data before sending a RAG prompt to Ollama", async () => {
    global.fetch.and.callFake((url) => {
      if (url.toString().includes('generativelanguage.googleapis.com')) {
        return createGeminiIntentResponse({
          needsSearch: true,
          searchQuery: "Paris",
          isFictional: false
        });
      }

      if (url === 'https://places.googleapis.com/v1/places:searchText') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            places: [
              {
                displayName: { text: "Mock Place" },
                formattedAddress: "123 Test St",
                rating: 4.5,
                googleMapsUri: "https://maps.google.com/?q=Mock+Place"
              }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ response: "Mock AI Response" })
      });
    });

    await handleChat("Plan my day in Paris");

    const placesCall = global.fetch.calls.argsFor(1);
    expect(placesCall[0]).toBe('https://places.googleapis.com/v1/places:searchText');
    expect(placesCall[1]).toEqual(jasmine.objectContaining({
      method: 'POST',
      headers: jasmine.objectContaining({
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.googleMapsUri,places.types'
      }),
      body: JSON.stringify({ textQuery: 'Paris' })
    }));

    const ollamaCall = global.fetch.calls.argsFor(2);
    const ollamaBody = JSON.parse(ollamaCall[1].body);

    expect(ollamaCall[0]).toBe('http://127.0.0.1:11434/api/generate');
    expect(ollamaCall[1]).toEqual(jasmine.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }));
    expect(ollamaBody.model).toBe('gemma4:e4b');
    expect(ollamaBody.prompt).toContain('You are a travel itinerary planner.');
    expect(ollamaBody.prompt).toContain('Plan my day in Paris');
    expect(ollamaBody.prompt).toContain('Mock Place');
    expect(ollamaBody.stream).toBeFalse();
  });

  it("should return responses keyed by selected model", async () => {
    const result = await handleChat("Hello", ["llama3.2"]);

    expect(result).toEqual({ "llama3.2": "Mock AI Response" });

    const ollamaBody = JSON.parse(global.fetch.calls.argsFor(1)[1].body);
    expect(ollamaBody.model).toBe('llama3.2');
  });

  it("should throw a helpful error when Google Places responds with a bad status", async () => {
    global.fetch.and.callFake((url) => {
      if (url.toString().includes('generativelanguage.googleapis.com')) {
        return createGeminiIntentResponse({
          needsSearch: true,
          searchQuery: "Paris",
          isFictional: false
        });
      }

      if (url === 'https://places.googleapis.com/v1/places:searchText') {
        return Promise.resolve({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ response: "Mock AI Response" })
      });
    });

    await expectAsync(handleChat("Plan my day in Paris")).toBeRejectedWithError(
      'Unable to complete destination recommendation. Google Places error: 503 Service Unavailable'
    );
  });
});
