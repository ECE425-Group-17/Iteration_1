const { EventEmitter } = require('events');
const { createRequestListener } = require('../server.js');

function invokeRoute(listener, { method, url, body }) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;

    const res = {
      statusCode: 200,
      headers: {},
      writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = headers;
      },
      end(chunk = '') {
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: chunk.toString()
        });
      }
    };

    Promise.resolve(listener(req, res)).catch(reject);

    process.nextTick(() => {
      if (body !== undefined) {
        req.emit('data', Buffer.from(JSON.stringify(body)));
      }
      req.emit('end');
    });
  });
}

describe("Server API Route", () => {
  let chatHandler;
  let regenerateHandler;
  let listener;

  beforeEach(() => {
    chatHandler = jasmine.createSpy('chatHandler').and.resolveTo([
      { model: 'llama3.2', reply: 'Mock AI reply 1' },
      { model: 'gemma4:e4b', reply: 'Mock AI reply 2' },
      { model: 'mistral', reply: 'Mock AI reply 3' }
    ]);
    regenerateHandler = jasmine.createSpy('regenerateHandler').and.resolveTo({
      model: 'gemma4:e4b',
      reply: 'Regenerated reply'
    });
    listener = createRequestListener(chatHandler, regenerateHandler);
  });

  it("returns 400 when an empty message is sent to /api/chat", async () => {
    const response = await invokeRoute(listener, {
      method: 'POST',
      url: '/api/chat',
      body: { message: '   ' }
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      reply: 'Please enter a message before sending.'
    });
    expect(chatHandler).not.toHaveBeenCalled();
  });

  it("returns all AI replies when a valid message is sent to /api/chat", async () => {
    const response = await invokeRoute(listener, {
      method: 'POST',
      url: '/api/chat',
      body: { message: 'Hello there' }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      replies: [
        { model: 'llama3.2', reply: 'Mock AI reply 1' },
        { model: 'gemma4:e4b', reply: 'Mock AI reply 2' },
        { model: 'mistral', reply: 'Mock AI reply 3' }
      ]
    });
    expect(chatHandler).toHaveBeenCalledWith('Hello there');
  });

  it("returns 500 when the chat handler fails", async () => {
    chatHandler.and.rejectWith(new Error('Ollama offline'));

    const response = await invokeRoute(listener, {
      method: 'POST',
      url: '/api/chat',
      body: { message: 'Hello there' }
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({ reply: 'Ollama offline' });
  });

  it("regenerates one selected model response", async () => {
    const response = await invokeRoute(listener, {
      method: 'POST',
      url: '/api/chat/regenerate',
      body: { message: 'Hello there', model: 'gemma4:e4b' }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      reply: { model: 'gemma4:e4b', reply: 'Regenerated reply' }
    });
    expect(regenerateHandler).toHaveBeenCalledWith('Hello there', 'gemma4:e4b');
  });

  it("returns 400 when regenerate is missing the model name", async () => {
    const response = await invokeRoute(listener, {
      method: 'POST',
      url: '/api/chat/regenerate',
      body: { message: 'Hello there' }
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      reply: 'Please choose which LLM response to regenerate.'
    });
    expect(regenerateHandler).not.toHaveBeenCalled();
  });
});
