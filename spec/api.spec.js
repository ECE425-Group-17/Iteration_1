const http = require('http');

describe("Server API Route", () => {
  it("should return 400 if an empty message is sent to /api/chat", (done) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      expect(res.statusCode).toBe(400);
      done();
    });

    req.write(JSON.stringify({ message: " " }));
    req.end();
  });
});