// spec/serverUnitTest.js

// ---------------------
// Server code
// ---------------------

const homePage = '<html>Sign Up / Login page</html>';
const landingPage = '<html>Landing Page</html>';
const dashboardPage = '<html>Dashboard Page</html>';

function handleRequest(req, res) {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(homePage);
  } 
  else if (req.method === 'GET' && req.url === '/landing') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(landingPage);
  }
  else if (req.method === 'GET' && req.url === '/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(dashboardPage);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

// ---------------------
// Mock Response Object
// ---------------------

function createMockRes() {
  let statusCode = null;
  let headers = null;
  let body = '';
  return {
    writeHead: (code, hdrs) => { statusCode = code; headers = hdrs; },
    end: (data) => { body = data; },
    getResult: () => ({ statusCode, headers, body }),
  };
}

// ---------------------
// Jasmine Tests
// ---------------------

describe('handleRequest function', () => {

  it('should return home page for GET /', () => {
    const req = { method: 'GET', url: '/' };
    const res = createMockRes();
    handleRequest(req, res);
    const result = res.getResult();

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('text/html');
    expect(result.body).toContain('Sign Up');
  });

  it('should return landing page for GET /landing', () => {
    const req = { method: 'GET', url: '/landing' };
    const res = createMockRes();
    handleRequest(req, res);
    const result = res.getResult();

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('text/html');
    expect(result.body).toContain('Landing Page');
  });

  it('should return dashboard page for GET /dashboard', () => {
    const req = { method: 'GET', url: '/dashboard' };
    const res = createMockRes();
    handleRequest(req, res);
    const result = res.getResult();

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('Dashboard Page');
  });

  it('should return 404 for unknown route', () => {
    const req = { method: 'GET', url: '/unknown' };
    const res = createMockRes();
    handleRequest(req, res);
    const result = res.getResult();

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe('Not Found');
  });

  it("should return 404 for POST /", () => {
    const req = { method: "POST", url: "/" };
    const res = createMockRes();

    handleRequest(req, res);
    const result = res.getResult();

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe("Not Found");
  });

  it("should return plain text content type for unknown routes", () => {
    const req = { method: "GET", url: "/unknown" };
    const res = createMockRes();

    handleRequest(req, res);
    const result = res.getResult();

    expect(result.statusCode).toBe(404);
    expect(result.headers["Content-Type"]).toBe("text/plain");
  });

});
