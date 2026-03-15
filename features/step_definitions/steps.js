const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const puppeteer = require("puppeteer");
const assert = require("assert");

let browser;
let page;

Before(async function () {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
});

After(async function () {
  if (browser) {
    await browser.close();
  }
});

Given("the browser is open", async function () {
});

When("the user goes to the home page", async function () {
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });
});

When("the user enters a valid login email and password", async function () {
  await page.type("#loginEmail", "test@example.com");
  await page.type("#loginPassword", "password123");
});

When("the user clicks the login button", async function () {
  await page.click("#loginBtn");
});

Then("the user should be redirected to the dashboard", async function () {
  await page.waitForNavigation({ waitUntil: "networkidle2" });
  const url = page.url();
  assert(url.includes("/dashboard"));
});

When("the user enters a username email and password for signup", async function () {
  await page.type("#signupUsername", "testuser");
  await page.type("#signupEmail", "newuser@example.com");
  await page.type("#signupPassword", "password123");
});

When("the user clicks the signup button", async function () {
  await page.click("#signupBtn");
});

Then("a signup success message should appear", async function () {
  await page.waitForSelector("#message");
  const message = await page.$eval("#message", el => el.textContent);
  assert(message.includes("Signup"));
});

When("the user enters their email for password reset", async function () {
  await page.type("#resetEmail", "test@example.com");
});

When("the user clicks the reset button", async function () {
  await page.click("#resetBtn");
});

Then("a password reset message should appear", async function () {
  await page.waitForSelector("#message");
  const message = await page.$eval("#message", el => el.textContent);
  assert(message.toLowerCase().includes("password reset"));
});