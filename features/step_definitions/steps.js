const { Before, After, Given, When, Then, BeforeAll, AfterAll} = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const assert = require('assert');

const { setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(15000); // 15 seconds

let browser;
let page;

BeforeAll(async function () {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
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
  const timeout = 30000;

  await page.waitForFunction(() => {
    return document.querySelectorAll('.compare-card').length > 0;
  }, { timeout });

  await page.waitForFunction(() => {
    const cards = document.querySelectorAll('.compare-card p');
    return Array.from(cards).some(card => card.innerText.trim().length > 0 && !card.innerText.includes('Generating response'));
  }, { timeout });

  const responses = await page.$$eval('.compare-card p', els =>
    els.map(e => e.innerText.trim())
  );

  assert(responses.length > 0);
});

Given('I am logged in on the dashboard chat page', async function () {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    sessionStorage.setItem("loggedInUserEmail", "test@example.com");
    sessionStorage.setItem("mockChat", "true");
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });

  await page.waitForSelector('#userInput');
  await page.waitForSelector('#sendBtn');
  await page.waitForSelector('#compare-view');
});

Given('I am logged in with mock chat enabled', async function () {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("loggedInUserEmail", "test@example.com");
    sessionStorage.setItem("mockChat", "true");
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });

  await page.waitForSelector('#userInput');
  await page.waitForSelector('#sendBtn');
});

Then('I should see {int} LLM response cards', async function (count) {
  await page.waitForFunction(
    expectedCount => document.querySelectorAll('.compare-card').length === expectedCount,
    {},
    count
  );

  const actualCount = await page.$$eval('.compare-card', cards => cards.length);
  assert.strictEqual(actualCount, count);
});

When('I remember the response for model {string}', async function (modelName) {
  this.savedResponse = await page.$$eval('.compare-card', (cards, targetModel) => {
    const match = cards.find(card => {
      const title = card.querySelector('h3');
      return title && title.textContent.trim() === targetModel;
    });

    if (!match) {
      return null;
    }

    const text = match.querySelector('p');
    return text ? text.textContent.trim() : null;
  }, modelName);
});

When('I regenerate the response for model {string}', async function (modelName) {
  await page.evaluate(targetModel => {
    const button = Array.from(document.querySelectorAll('.regenerate-btn')).find(btn => btn.dataset.model === targetModel);
    if (!button) {
      throw new Error('Regenerate button not found for model: ' + targetModel);
    }
    button.click();
  }, modelName);
});

Then('the response for model {string} should change', async function (modelName) {
  await page.waitForFunction(
    ({ targetModel, previousText }) => {
      const cards = Array.from(document.querySelectorAll('.compare-card'));
      const match = cards.find(card => {
        const title = card.querySelector('h3');
        return title && title.textContent.trim() === targetModel;
      });

      if (!match) {
        return false;
      }

      const text = match.querySelector('p');
      return text && text.textContent.trim() !== previousText;
    },
    {},
    { targetModel: modelName, previousText: this.savedResponse }
  );
});

When('I choose font size {string}', async function (fontSize) {
  await page.select('#fontSizeSelect', fontSize);
});

Then('the chat font size should be {string}', async function (expectedFontSize) {
  const actualFontSize = await page.$eval('.compare-card', element => getComputedStyle(element).fontSize);
  assert.strictEqual(actualFontSize, expectedFontSize);
});
