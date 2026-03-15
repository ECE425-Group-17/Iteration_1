const http = require('http');

// ====================================== html ===========================================

const homePage = `
  <html>
  <head>
    <title>Login Page</title>
    <style>
      body { display:flex; justify-content:center; align-items:center; height:100vh; margin:0; font-family:Arial,sans-serif; background:#f0f0f0; }
      .login-box { background:white; padding:2rem; border-radius:8px; box-shadow:0 0 10px rgba(0,0,0,0.2); text-align:center; width:300px; }
      input { display:block; width:100%; padding:0.5rem; margin:0.5rem 0; box-sizing:border-box; }
      button { padding:0.5rem 1rem; margin-top:1rem; width:100%; }
      .msg { margin-top:1rem; color:#333; font-size:14px; }
      hr { margin:1.5rem 0; }
    </style>
  </head>
  <body>
    <div class="login-box">

      <h2>Sign Up</h2>
      <input type="email" id="signupEmail" placeholder="Email">
      <input type="password" id="signupPassword" placeholder="Password">
      <button id="signupBtn">Create Account</button>

      <hr>

      <h2>Login</h2>
      <input type="email" id="loginEmail" placeholder="Email">
      <input type="password" id="loginPassword" placeholder="Password">
      <button id="loginBtn">Login</button>

      <p class="msg" id="message"></p>

      <br>
      <a href="/landing">Go to Landing Page</a>
    </div>

    <script type="module">
      import { auth } from "/firebase.js";
      import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

      const message = document.getElementById("message");

      document.getElementById("signupBtn").addEventListener("click", async () => {
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        try {
          await createUserWithEmailAndPassword(auth, email, password);
          message.textContent = "Signup successful";
        } catch (err) {
          message.textContent = err.message;
        }
      });

      document.getElementById("loginBtn").addEventListener("click", async () => {
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
          await signInWithEmailAndPassword(auth, email, password);
          window.location.href = "/dashboard";
        } catch (err) {
          message.textContent = "Invalid email or password";
        }
      });
    </script>
  </body>
  </html>
`;

const landingPage = `
  <html>
  <head>
    <title>Landing Page</title>
  </head>
  <body>
    <h1>Welcome to the Landing Page</h1>
    <p>This is a separate page.</p>
    <a href="/">Back to Login / Sign Up</a>
  </body>
  </html>
`;

const dashboardPage = `
  <html>
  <head>
    <title>Dashboard</title>
  </head>
  <body>
    <h1>Welcome to your dashboard</h1>
    <p>You logged in successfully.</p>
    <a href="/">Log out</a>
  </body>
  </html>
`;

// ====================================== html ===========================================



const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(homePage);
  } 
  else if (req.method === 'GET' && req.url === '/landing') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(landingPage);
  }
  else if (req.method === 'GET' && req.url === '/dashboard') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(dashboardPage);
  }
  else if (req.method === 'GET' && req.url === '/firebase.js') {
    const fs = require('fs');
    const path = require('path');
    const firebaseFile = path.join(__dirname, 'firebase.js');

    fs.readFile(firebaseFile, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Error loading firebase.js');
        return;
      }

      res.writeHead(200, {'Content-Type': 'application/javascript'});
      res.end(data);
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