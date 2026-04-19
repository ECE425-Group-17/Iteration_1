const fs = require('fs');
const http = require('http');
const path = require('path');
const { handleChat, runModel } = require('./chat.js');

const homePage = `
  <html>
  <head>
    <title>Sign In</title>
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
        width: 360px;
      }
      input {
        display: block;
        width: 100%;
        padding: 0.75rem;
        margin: 0.5rem 0;
        box-sizing: border-box;
      }
      button {
        padding: 0.75rem 1rem;
        margin-top: 0.75rem;
        width: 100%;
      }
      .secondary-button {
        background: white;
        border: 1px solid #ccc;
      }
      .msg {
        margin-top: 1rem;
        color: #333;
        font-size: 14px;
      }
      .subtext {
        color: #666;
        font-size: 14px;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="login-box">
      <h2>Sign In</h2>
      <p class="subtext">Log in first, then you can start chatting.</p>

      <input type="email" id="loginEmail" placeholder="Email">
      <input type="password" id="loginPassword" placeholder="Password">
      <button id="loginBtn">Login</button>
      <button class="secondary-button" id="goSignupBtn">Go to Sign Up</button>
      <button class="secondary-button" id="goResetBtn">Forgot Password</button>

      <p class="msg" id="message"></p>

      <br>
      <a href="/landing">Go to Landing Page</a>
    </div>

    <script type="module">
      import { auth } from "/firebase.js";
      import {
        signInWithEmailAndPassword,
        sendEmailVerification,
        signOut
      } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

      const message = document.getElementById("message");

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

          sessionStorage.setItem("loggedInUserEmail", user.email);
          window.location.href = "/dashboard";
        } catch (err) {
          message.textContent = "Invalid email or password";
        }
      });

      document.getElementById("goSignupBtn").addEventListener("click", () => {
        window.location.href = "/signup";
      });

      document.getElementById("goResetBtn").addEventListener("click", () => {
        window.location.href = "/reset-password";
      });
    </script>
  </body>
  </html>
`;

const signUpPage = `
  <html>
  <head>
    <title>Sign Up</title>
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
        width: 360px;
      }
      input {
        display: block;
        width: 100%;
        padding: 0.75rem;
        margin: 0.5rem 0;
        box-sizing: border-box;
      }
      button {
        padding: 0.75rem 1rem;
        margin-top: 0.75rem;
        width: 100%;
      }
      .secondary-button {
        background: white;
        border: 1px solid #ccc;
      }
      .msg {
        margin-top: 1rem;
        color: #333;
        font-size: 14px;
      }
      .subtext {
        color: #666;
        font-size: 14px;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="login-box">
      <h2>Create Account</h2>
      <p class="subtext">Set up your account first, then return to sign in.</p>

      <input type="text" id="signupUsername" placeholder="Username">
      <input type="email" id="signupEmail" placeholder="Email">
      <input type="password" id="signupPassword" placeholder="Password">
      <button id="signupBtn">Sign Up</button>
      <button class="secondary-button" id="backToLoginBtn">Back to Sign In</button>

      <p class="msg" id="message"></p>
    </div>

    <script type="module">
      import { auth, db } from "/firebase.js";
      import {
        createUserWithEmailAndPassword,
        sendEmailVerification
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
          message.textContent = "Signup successful. Verification email sent. You can sign in after verifying.";
        } catch (err) {
          message.textContent = err.message;
        }
      });

      document.getElementById("backToLoginBtn").addEventListener("click", () => {
        window.location.href = "/";
      });
    </script>
  </body>
  </html>
`;

const resetPasswordPage = `
  <html>
  <head>
    <title>Reset Password</title>
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
        width: 360px;
      }
      input {
        display: block;
        width: 100%;
        padding: 0.75rem;
        margin: 0.5rem 0;
        box-sizing: border-box;
      }
      button {
        padding: 0.75rem 1rem;
        margin-top: 0.75rem;
        width: 100%;
      }
      .secondary-button {
        background: white;
        border: 1px solid #ccc;
      }
      .msg {
        margin-top: 1rem;
        color: #333;
        font-size: 14px;
      }
      .subtext {
        color: #666;
        font-size: 14px;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="login-box">
      <h2>Reset Password</h2>
      <p class="subtext">Enter your email and we will send a reset link.</p>

      <input type="email" id="resetEmail" placeholder="Enter email for password reset">
      <button id="resetBtn">Send Password Reset Email</button>
      <button class="secondary-button" id="backToLoginBtn">Back to Sign In</button>

      <p class="msg" id="message"></p>
    </div>

    <script type="module">
      import { auth } from "/firebase.js";
      import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

      const message = document.getElementById("message");

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

      document.getElementById("backToLoginBtn").addEventListener("click", () => {
        window.location.href = "/";
      });
    </script>
  </body>
  </html>
`;

const landingPage = `
  <html>
  <head>
    <title>Front page</title>
  </head>
  <body>
    <h1>Welcome</h1>
    <p>Please log in to use the chat assistant.</p>
    <a href="/">Go to Login</a>
  </body>
  </html>
`;

const dashboardPage = `
  <html>
  <head>
    <title>Dashboard</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        background: #eef1f4;
      }
      .container {
        max-width: 1180px;
        min-height: calc(100vh - 48px);
        margin: 24px auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        display: flex;
      }
      .sidebar {
        width: 280px;
        background: #1f2937;
        color: white;
        padding: 18px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .sidebar h2 {
        margin: 0;
        font-size: 20px;
      }
      .sidebar button {
        width: 100%;
        border: 0;
        border-radius: 8px;
        padding: 11px 14px;
        cursor: pointer;
        font-size: 14px;
      }
      .sidebar .new-chat-btn {
        background: #f59e0b;
        color: #111827;
        font-weight: bold;
      }
      #conversation-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow-y: auto;
        max-height: 70vh;
      }
      .conversation-item {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid transparent;
        border-radius: 10px;
        padding: 12px;
        cursor: pointer;
      }
      .conversation-item.active {
        background: rgba(245, 158, 11, 0.18);
        border-color: #f59e0b;
      }
      .conversation-title {
        font-weight: bold;
        margin-bottom: 4px;
      }
      .conversation-preview {
        font-size: 13px;
        color: #d1d5db;
      }
      .main-panel {
        flex: 1;
        padding: 24px;
        display: flex;
        flex-direction: column;
      }
      .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }
      .top-bar h1 {
        margin-bottom: 8px;
      }
      #chat-box {
        border: 1px solid #ccc;
        flex: 1;
        min-height: 320px;
        overflow-y: auto;
        margin: 20px 0 12px;
        padding: 12px;
        background: #fafafa;
        border-radius: 10px;
      }
      .chat-row {
        margin-bottom: 10px;
        line-height: 1.4;
        padding: 10px 12px;
        border-radius: 10px;
        max-width: 85%;
      }
      .chat-row.user {
        color: #1f4d8f;
        background: #dbeafe;
        margin-left: auto;
      }
      .chat-row.ai {
        color: #1b5e20;
        background: #dcfce7;
      }
      .chat-row.system {
        color: #8a1c1c;
        background: #fee2e2;
        max-width: 100%;
      }
      .composer {
        display: flex;
        gap: 10px;
      }
      .composer input {
        flex: 1;
        padding: 10px;
      }
      .composer button,
      .top-bar button {
        padding: 10px 14px;
        cursor: pointer;
        width: auto;
      }
      .helper-text {
        color: #666;
        font-size: 14px;
      }
      #conversation-name {
        color: #374151;
        font-size: 14px;
        margin-top: 6px;
      }
      .chat-row.llama{
      background: #e0f2fe;
      color: #075985;
      }
      .chat-row.mistral{
      background: #fef3c7;
      color: #92400e;
      }

      .chat-row.gemma{
      background: #e9d5ff;
      color: #581c87;
      }

      .chat-row.system{
      background: #f3f4f6;
      color: #374151;
      font-style: italic;
      }

    </style>
  </head>
  <body>
    <div class="container">
      <aside class="sidebar">
        <div>
          <h2>Your Chats</h2>
          <p class="helper-text" style="color:#d1d5db;">Create a new conversation or reopen an older one.</p>
        </div>
        <button class="new-chat-btn" id="newChatBtn">+ New Chat</button>
        <div id="conversation-list"></div>
        <button id="logoutBtn">Log out</button>
      </aside>

      
      <div class="main-panel">
        <div class="top-bar">
          <div>
            <h1>Welcome to your dashboard</h1>
            <p class="helper-text">Your chats are organized by conversation for this signed-in user.</p>
            <div id="conversation-name"></div>
          </div>
          <button id="clearBtn">Delete Current Chat</button>
        </div>

        <h2>Chat with Ollama</h2>
        <div id="chat-box"></div>

        <div class="composer">
          <input type="text" id="userInput" placeholder="Type a message...">
          <button id="sendBtn">Send</button>
        </div>
      </div>
    </div>

        <script>
      const userEmail = sessionStorage.getItem("loggedInUserEmail");

      if (!userEmail) {
        window.location.href = "/";
      }

      const chatBox = document.getElementById("chat-box");
      const userInput = document.getElementById("userInput");
      const conversationList = document.getElementById("conversation-list");
      const conversationName = document.getElementById("conversation-name");
      const conversationStoreKey = "chatConversations:" + userEmail;
      const activeConversationKey = "activeConversation:" + userEmail;

      function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
      }

      function getConversationStore() {
        const saved = localStorage.getItem(conversationStoreKey);
        if (!saved) return [];
        try {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
          return [];
        }
      }

      function saveConversationStore(conversations) {
        localStorage.setItem(conversationStoreKey, JSON.stringify(conversations));
      }

      function createConversation(title) {
        return {
          id: "conversation-" + Date.now() + "-" + Math.random().toString(16).slice(2),
          title: title || "New Chat",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: []
        };
      }

      function getActiveConversationId() {
        return localStorage.getItem(activeConversationKey);
      }

      function setActiveConversationId(conversationId) {
        localStorage.setItem(activeConversationKey, conversationId);
      }

      function ensureConversationState() {
        const conversations = getConversationStore();
        let activeId = getActiveConversationId();

        if (conversations.length === 0) {
          const starter = createConversation("New Chat");
          saveConversationStore([starter]);
          setActiveConversationId(starter.id);
          return [starter];
        }

        if (!activeId || !conversations.some(c => c.id === activeId)) {
          setActiveConversationId(conversations[0].id);
        }
        return conversations;
      }

      function getActiveConversation() {
        const conversations = ensureConversationState();
        const activeId = getActiveConversationId();
        return conversations.find(c => c.id === activeId) || conversations[0];
      }

      function updateConversation(updatedConversation) {
        const conversations = getConversationStore().map(c =>
          c.id === updatedConversation.id ? { ...updatedConversation, updatedAt: Date.now() } : c
        );
        saveConversationStore(conversations);
      }

      function appendMessage(role, text) {
        const row = document.createElement("div");
        const cssClass = role.includes("llama") ? "llama" : role;
        row.className = "chat-row " + cssClass;

        const labelMap = {
          user: "USER",
          llama: "LLAMA3.1",
          mistral: "MISTRAL",
          gemma: "GEMMA3",
          system: "SYSTEM"
        };

        row.innerHTML = "<b>" + (labelMap[cssClass] || role.toUpperCase()) + ": </b>" + escapeHtml(text);
        chatBox.appendChild(row);
        chatBox.scrollTop = chatBox.scrollHeight;
        return row;
      }

      function renderActiveConversation() {
        const activeConversation = getActiveConversation();
        chatBox.innerHTML = "";
        conversationName.textContent = "Current conversation: " + activeConversation.title;

        if (activeConversation.messages.length === 0) {
          appendMessage("system", "No messages yet. Start chatting below!");
        } else {
          activeConversation.messages.forEach(m => appendMessage(m.role, m.text));
        }
      }

      function renderConversationList() {
        const conversations = getConversationStore().sort((a, b) => b.updatedAt - a.updatedAt);
        const activeId = getActiveConversationId();
        conversationList.innerHTML = "";

        conversations.forEach(conv => {
          const item = document.createElement("div");
          item.className = "conversation-item" + (conv.id === activeId ? " active" : "");
          const lastMsg = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text : "Empty chat";
          
          item.innerHTML = \`
            <div class="conversation-title">\${escapeHtml(conv.title)}</div>
            <div class="conversation-preview">\${escapeHtml(lastMsg.slice(0, 40))}...</div>
          \`;
          item.onclick = () => {
            setActiveConversationId(conv.id);
            renderConversationList();
            renderActiveConversation();
          };
          conversationList.appendChild(item);
        });
      }

      function createNewConversation() {
        const newConv = createConversation("New Chat");
        const store = getConversationStore();
        store.push(newConv);
        saveConversationStore(store);
        setActiveConversationId(newConv.id);
        renderConversationList();
        renderActiveConversation();
      }

async function sendChat() {
        const inputMessage = userInput.value.trim();
        if (!inputMessage) return;

        appendMessage("user", inputMessage);
        userInput.value = "";

        const activeConv = getActiveConversation();
        activeConv.messages.push({ role: "user", text: inputMessage });
        
        if (activeConv.messages.length === 1 || activeConv.title === "New Chat") {
            activeConv.title = inputMessage.length > 25 ? inputMessage.slice(0, 25) + "..." : inputMessage;
        }
        updateConversation(activeConv);
        renderConversationList();

        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: inputMessage })
          });

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let statusIndicator = null;
          let buffer = ""; 

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, {stream: true});
            const lines = buffer.split("\\n");
            buffer = lines.pop(); // FIXED: Added parentheses

            for (const line of lines) {
                  if (!line.startsWith("data:")) continue;
                  
                  let data;
                  try {
                    data = JSON.parse(line.replace("data:", "").trim());
                  } catch (e) {
                    console.error("JSON parse error", e);
                    continue; 
                  }

                  if (data.type === "status") {
                    if (statusIndicator) statusIndicator.remove();
                    // FIXED: Corrected string concatenation syntax
                    statusIndicator = appendMessage("system", "(" + data.model + ") is thinking...");
                  }

                  if (data.type === "response") {
                    if (statusIndicator) {
                      statusIndicator.remove();
                      statusIndicator = null;
                    }
                appendMessage(data.model, data.text);
                
                const currentConv = getActiveConversation();
                currentConv.messages.push({ role: data.model, text: data.text });
                updateConversation(currentConv);
              }
            }
          }
        } catch (err) {
          appendMessage("system", "Error: " + err.message);
        }
      }

      
      document.getElementById("sendBtn").addEventListener("click", sendChat);
      document.getElementById("newChatBtn").addEventListener("click", createNewConversation);
      document.getElementById("clearBtn").addEventListener("click", () => {
        const activeId = getActiveConversationId();
        const remaining = getConversationStore().filter(c => c.id !== activeId);
        saveConversationStore(remaining);
        localStorage.removeItem(activeConversationKey);
        ensureConversationState();
        renderConversationList();
        renderActiveConversation();
      });

      userInput.addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });
      document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.removeItem("loggedInUserEmail");
        window.location.href = "/";
      });

      ensureConversationState();
      renderConversationList();
      renderActiveConversation();
    </script>
  </body>
  </html>
`;

function createRequestListener(chatHandler = handleChat) {
  return async (req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(homePage);
    }
    else if (req.method === 'GET' && req.url === '/signup') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(signUpPage);
    }
    else if (req.method === 'GET' && req.url === '/reset-password') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(resetPasswordPage);
    }
    else if (req.method === 'GET' && req.url === '/landing') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(landingPage);
    }
    else if (req.method === 'GET' && req.url === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(dashboardPage);
    }
    else if (req.method === 'POST' && req.url === '/api/chat') {

      let body = '';

      req.on('data', chunk => body += chunk);

      req.on('end', async () => {

        const { message } = JSON.parse(body);

        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        });

        try {

          res.write(`data: ${JSON.stringify({ type: "status", model: "llama" })}\n\n`);
          const r1 = await runModel("llama3.1", message);
          res.write(`data: ${JSON.stringify({ type: "response", model: "llama", text: r1 })}\n\n`);

          res.write(`data: ${JSON.stringify({ type: "status", model: "mistral" })}\n\n`);
          const r2 = await runModel("mistral", message);
          res.write(`data: ${JSON.stringify({ type: "response", model: "mistral", text: r2 })}\n\n`);

          res.write(`data: ${JSON.stringify({ type: "status", model: "gemma" })}\n\n`);
          const r3 = await runModel("gemma3", message);
          res.write(`data: ${JSON.stringify({ type: "response", model: "gemma", text: r3 })}\n\n`);

          res.end();

        } catch (err) {
          res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
          res.end();
        }

      });
    }
    else if (req.method === 'GET' && req.url === '/firebase.js') {
      const firebaseFile = path.join(__dirname, 'firebase.js');

      fs.readFile(firebaseFile, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading firebase.js');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(data);
      });
    }
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  };
}

function createServer(chatHandler = handleChat) {
  return http.createServer(createRequestListener(chatHandler));
}

if (require.main === module) {
  const server = createServer();
  server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

module.exports = { createRequestListener, createServer };
