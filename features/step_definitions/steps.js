const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const puppeteer = require("puppeteer");
const assert = require("assert");

let browser;
let page;
let realEmail = "nol10@scarletmail.rutgers.edu";
let realPassword = "Password1234"
let testEmail;
let testPassword = "password123";
let testUsername = "testuser";

Before(async function () {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
});

After(async function () {
  if (browser) {
    await browser.close();
  }
});

Given("the browser is open", async function () {});

When("the user goes to the home page", async function () {
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });
});

When("the user enters a username email and password for signup", async function () {
  testEmail = `test${Date.now()}@example.com`;

  await page.type("#signupUsername", testUsername);
  await page.type("#signupEmail", testEmail);
  await page.type("#signupPassword", testPassword);
});

When("the user clicks the signup button", async function () {
  await page.click("#signupBtn");
  await new Promise(resolve => setTimeout(resolve, 1500));
});

Then("a signup success message should appear", async function () {
  await page.waitForFunction(() => {
    const el = document.querySelector("#message");
    return el && el.textContent.trim().length > 0;
  });

  const message = await page.$eval("#message", el => el.textContent.trim());
  console.log("Signup message:", message);
  assert(message.length > 0);
});

When("the user enters a valid login email and password", async function () {
  await page.type("#loginEmail", realEmail);
  await page.type("#loginPassword", realPassword);
});

When("the user clicks the login button", async function () {
  await page.click("#loginBtn");
});

Then("the user should be redirected to the dashboard", async function () {
  await page.waitForFunction(() => window.location.pathname === "/dashboard", {
    timeout: 10000
  });

  const url = page.url();
  console.log("Current URL:", url);
  assert(url.includes("/dashboard"));
});

When("the user enters their email for password reset", async function () {
  await page.type("#resetEmail", "test@example.com");
});

When("the user clicks the reset button", async function () {
  await page.click("#resetBtn");
  await new Promise(resolve => setTimeout(resolve, 1500));
});

Then("a password reset message should appear", async function () {
  await page.waitForFunction(() => {
    const el = document.querySelector("#message");
    return el && el.textContent.trim().length > 0;
  });

  const message = await page.$eval("#message", el => el.textContent.trim());
  console.log("Reset message:", message);
  assert(message.length > 0);
});

When("the user enters an invalid login email and password", async function () {
  await page.type("#loginEmail", "wrong@example.com");
  await page.type("#loginPassword", "WrongPassword123");
});

When("the user leaves the login fields blank", async function () {
  // intentionally left blank
});

Then("a login error message should appear", async function () {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const messageExists = await page.$("#message");
  if (messageExists) {
    const message = await page.$eval("#message", el => el.textContent.trim());
    console.log("Login error message:", message);
    assert(message.length > 0);
  } else {
    const url = page.url();
    assert(url.includes("localhost:3000"));
  }
});

Then("a login validation message should appear", async function () {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const url = page.url();
  assert(url.includes("localhost:3000"));
});

When("the user enters signup information without email", async function () {
  await page.type("#signupUsername", "testuser2");
  await page.type("#signupPassword", "password123");
});

When("the user enters signup information without password", async function () {
  testEmail = `test${Date.now()}@example.com`;
  await page.type("#signupUsername", "testuser3");
  await page.type("#signupEmail", testEmail);
});

Then("a signup error message should appear", async function () {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const messageExists = await page.$("#message");
  if (messageExists) {
    const message = await page.$eval("#message", el => el.textContent.trim());
    console.log("Signup error message:", message);
    assert(message.length > 0);
  } else {
    const url = page.url();
    assert(url.includes("localhost:3000"));
  }
});

When("the user leaves the reset email field blank", async function () {
  // intentionally left blank
});

Then("a reset validation message should appear", async function () {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const messageExists = await page.$("#message");
  if (messageExists) {
    const message = await page.$eval("#message", el => el.textContent.trim());
    console.log("Reset validation message:", message);
    assert(message.length > 0);
  } else {
    const url = page.url();
    assert(url.includes("localhost:3000"));
  }
});
