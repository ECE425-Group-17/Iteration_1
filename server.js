const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html>
      <head>
        <title>Login Page</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f0f0f0;
          }
          .login-box {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            text-align: center;
          }
          input {
            display: block;
            width: 100%;
            padding: 0.5rem;
            margin: 0.5rem 0;
          }
          button {
            padding: 0.5rem 1rem;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="login-box">
          <h2>Login</h2>
          <form method="POST" action="/login">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Login</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});