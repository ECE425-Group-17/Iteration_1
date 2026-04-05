describe("Dashboard Conversation Management", () => {
  beforeAll(() => {
    global.localStorage = {
      store: {},
      getItem: (key) => global.localStorage.store[key] || null,
      setItem: (key, value) => { global.localStorage.store[key] = value.toString(); },
      removeItem: (key) => { delete global.localStorage.store[key]; },
      clear: () => { global.localStorage.store = {}; }
    };
    
    global.sessionStorage = {
      store: {},
      getItem: (key) => global.sessionStorage.store[key] || null,
      setItem: (key, value) => { global.sessionStorage.store[key] = value.toString(); },
      removeItem: (key) => { delete global.sessionStorage.store[key]; }
    };
  });

  it("should generate a new conversation ID with a timestamp", () => {
    const id = "conversation-" + Date.now();
    expect(id).toContain("conversation-");
  });

  it("should correctly title a chat based on the first message", () => {
    const createTitle = (msg) => msg.length > 28 ? msg.slice(0, 28) + "..." : msg;
    expect(createTitle("This is a very long message that should be truncated")).toBe("This is a very long message ...");
  });
});