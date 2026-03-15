const http = require('http');

const homePage = `
  <html>
  <head>
    <title>Login Page</title>
    <style>
      body {
        display:flex;
        justify-content:center;
        align-items:center;
        height:100vh;
        margin:0;
        font-family:Arial,sans-serif;
        background:#f0f0f0;
      }
      .login-box {
        background:white;
        padding:2rem;
        border-radius:8px;
        box-shadow:0 0 10px rgba(0,0,0,0.2);
        text-align:center;
        width:320px;
      }
      input {
        display:block;
        width:100%;
        padding:0.5rem;
        margin:0.5rem 0;
        box-sizing:border-box;
      }
      button {
        padding:0.5rem 1rem;
        margin-top:0.5rem;
        width:100%;
      }
      .msg {
        margin-top:1rem;
        color:#333;
        font-size:14px;
      }
      hr {
        margin:1rem 0;
      }
    </style>
  </head>
  <body>
    <div class="login-box">
      <h2>Login / Sign Up</h2>

      <input type="text" id="signupUsername" placeholder="Username">
      <input type="email" id="signupEmail" placeholder="Email">
      <input type="password" id="signupPassword" placeholder="Password">
      <button id="signupBtn">Sign Up</button>

      <hr>

      <input type="email" id="loginEmail" placeholder="Email">
      <input type="password" id="loginPassword" placeholder="Password">
      <button id="loginBtn">Login</button>

      <hr>

      <input type="email" id="resetEmail" placeholder="Enter email for password reset">
      <button id="resetBtn">Send Password Reset Email</button>

      <p class="msg" id="message"></p>

      <br>
      <a href="/landing">Go to Landing Page</a>
    </div>

    <script type="module">
      import { auth, db } from "/firebase.js";
      import {
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        sendEmailVerification,
        sendPasswordResetEmail,
        signOut
      } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
      import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

      const message = document.getElementById("message");

      document.getElementById("signupBtn").addEventListener("click", async () => {
        const username = document.getElementById("signupUsername").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;

        if (!username || !email || !password) {
          message.textContent = "Please fill in all sign up fields.";
          return;
        }

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: email,
            createdAt: new Date().toISOString()
          });

          await sendEmailVerification(user);

          message.textContent = "Signup successful. Verification email sent. Please verify before logging in.";
        } catch (err) {
          message.textContent = err.message;
        }
      });

      document.getElementById("loginBtn").addEventListener("click", async () => {
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {
          message.textContent = "Please enter your email and password.";
          return;
        }

        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          await user.reload();

          if (!user.emailVerified) {
            message.innerHTML = 'Your email is not verified yet.<br><button id="resendVerificationBtn">Resend Verification Email</button>';

            document.getElementById("resendVerificationBtn").addEventListener("click", async () => {
              try {
                await sendEmailVerification(user);
                message.textContent = "Verification email resent. Check your inbox.";
              } catch (err) {
                message.textContent = err.message;
              }
            });

            await signOut(auth);
            return;
          }

          window.location.href = "/dashboard";
        } catch (err) {
          message.textContent = "Invalid email or password";
        }
      });

      document.getElementById("resetBtn").addEventListener("click", async () => {
        const email = document.getElementById("resetEmail").value.trim();

        if (!email) {
          message.textContent = "Please enter your email for password reset.";
          return;
        }

        try {
          await sendPasswordResetEmail(auth, email);
          message.textContent = "Password reset email sent. Check your inbox.";
        } catch (err) {
          message.textContent = err.message;
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