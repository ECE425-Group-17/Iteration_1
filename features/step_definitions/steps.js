const { Before, After, Given, When, Then, BeforeAll, AfterAll} = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const assert = require('assert');

const { setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(15000); // 15 seconds

let browser;
let page;

BeforeAll(async function () {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
  this.page = page;
});

AfterAll (async function () {
  if (browser) {
    await browser.close();
  }
});

Given('I open the app at {string}', async function (path) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle0' });
});

Given('I clear browser storage', async function () {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

Given('I set session storage {string} to {string}', async function (key, value) {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ key, value }) => {
      sessionStorage.setItem(key, value);
    },
    { key, value }
  );
});

When('I click the element with id {string}', async function (id) {
  await page.click(`#${id}`);
});

Then('I should see {string}', async function (text) {
  await page.waitForFunction(
    (expectedText) => document.body.innerText.includes(expectedText),
    {},
    text
  );

  const bodyText = await page.evaluate(() => document.body.innerText);
  assert(bodyText.includes(text));
});

Then('the current path should be {string}', async function (expectedPath) {
  await page.waitForFunction(
    (path) => window.location.pathname === path,
    {},
    expectedPath
  );

  const currentUrl = new URL(page.url());
  assert.strictEqual(currentUrl.pathname, expectedPath);
});

// ========================================= chat, the thing I added =========================================

When('I open the chat page', async function () {
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });

  await page.waitForSelector('#userInput');
  await page.waitForSelector('#sendBtn');
});

When('I send {string} in the chat', async function (text) {
  await page.type('#userInput', text);
  await page.click('#sendBtn');
});

Then('I should see a bot response', async function () {
  // allow long LLM latency
  const timeout = 30000;

  await page.waitForFunction(() => {
    return document.querySelectorAll('.chat-row.ai').length > 0;
  }, { timeout });

  await page.waitForFunction(() => {
    const msgs = document.querySelectorAll('.chat-row.ai');
    const last = msgs[msgs.length - 1];
    return last && last.innerText.trim().length > 0;
  }, { timeout });

  const responses = await page.$$eval('.chat-row.ai', els =>
    els.map(e => e.innerText.trim())
  );

  assert(responses.length > 0);
});

Given('I am logged in on the dashboard chat page', async function () {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    sessionStorage.setItem("loggedInUserEmail", "test@example.com");
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });

  await page.waitForSelector('#userInput');
  await page.waitForSelector('#sendBtn');
  await page.waitForSelector('#chat-box');
});