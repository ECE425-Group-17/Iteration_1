const { EventEmitter } = require('events');
const { createRequestListener } = require('../server.js');

function invokeGetRoute(listener, url) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = 'GET';
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
  });
}

describe("Dashboard And Page Routes", () => {
  let listener;

  beforeEach(() => {
    listener = createRequestListener(async () => 'unused');
  });

  it("serves the dashboard page", async () => {
    const response = await invokeGetRoute(listener, '/dashboard');

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Welcome to your dashboard');
    expect(response.body).toContain('Delete Current Chat');
    expect(response.body).toContain('Chat with 3 LLMs');
    expect(response.body).toContain('Regenerate');
    expect(response.body).toContain('Font Size');
  });

  it("serves firebase.js for the frontend", async () => {
    const response = await invokeGetRoute(listener, '/firebase.js');

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('initializeApp');
    expect(response.body).toContain('export const auth');
  });

  it("returns 404 for an unknown route", async () => {
    const response = await invokeGetRoute(listener, '/does-not-exist');

    expect(response.statusCode).toBe(404);
    expect(response.body).toBe('Not Found');
  });
});
