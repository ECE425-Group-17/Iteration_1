const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const qs = require('querystring');

// Create or open SQLite database file
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) throw err;
  console.log('Connected to SQLite database.');
});

// Create users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password_hash TEXT
)`);

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(qs.parse(body)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`
      <html>
      <head>
        <title>Login Page</title>
        <style>
          body { display:flex; justify-content:center; align-items:center; height:100vh; margin:0; font-family:Arial,sans-serif; background:#f0f0f0; }
          .login-box { background:white; padding:2rem; border-radius:8px; box-shadow:0 0 10px rgba(0,0,0,0.2); text-align:center; }
          input { display:block; width:100%; padding:0.5rem; margin:0.5rem 0; }
          button { padding:0.5rem 1rem; margin-top:1rem; }
        </style>
      </head>
      <body>
        <div class="login-box">
          <h2>Login / Sign Up</h2>
          <form method="POST" action="/login">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Login</button>
          </form>
          <form method="POST" action="/signup">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Sign Up</button>
          </form>
        </div>
      </body>
      </html>
    `);
  } 
  else if (req.method === 'POST' && req.url === '/signup') {
    const { username, password } = await parseBody(req);
    const hash = await bcrypt.hash(password, 10); // hash the password

    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function(err) {
      if (err) {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('Username already exists or error');
      } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Signup successful');
      }
    });
  } 
  else if (req.method === 'POST' && req.url === '/login') {
    const { username, password } = await parseBody(req);

    db.get('SELECT password_hash FROM users WHERE username = ?', [username], async (err, row) => {
      if (err || !row) {
        res.writeHead(401, {'Content-Type': 'text/plain'});
        res.end('Invalid username or password');
      } else {
        const match = await bcrypt.compare(password, row.password_hash);
        if (match) {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('Login successful');
        } else {
          res.writeHead(401, {'Content-Type': 'text/plain'});
          res.end('Invalid username or password');
        }
      }
    });
  } 
  else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found');
  }
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});