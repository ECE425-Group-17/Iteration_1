const { Before, After, Given, When, Then } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const assert = require('assert');

let browser;
let page;

Before(async function () {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  this.page = page;
});

After(async function () {
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