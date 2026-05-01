const { Before, After, Given, When, Then, BeforeAll, AfterAll} = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const assert = require('assert');

const { setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(15000); // 15 seconds

let browser;
let page;

const modelLabels = {
  Llama: 'llama3.2',
  Gemma: 'gemma',
  Mistral: 'mistral',
  GPT: 'gpt',
  Gemini: 'gemini',
  Claude: 'claude'
};

function mockChatReply(message, selectedModels) {
  const lowerMessage = message.toLowerCase();
  const model = selectedModels && selectedModels.length > 0 ? selectedModels[0] : 'gemma';

  let reply = [
    'Recommended Destination: Joe\'s Pizza',
    'Address: 7 Carmine St, New York, NY',
    'Rating: 4.5',
    'Why this place matches: It is a nearby food recommendation with strong reviews.',
    'Google Maps Link: https://maps.google.com/?q=Joes+Pizza+New+York'
  ].join('\n');

  if (lowerMessage.includes('food tour')) {
    reply = [
      'Travel Itinerary:',
      '1. Joe\'s Pizza',
      'Address: 7 Carmine St, New York, NY',
      'Why it fits the itinerary: Classic Manhattan pizza stop.',
      'Google Maps Link: https://maps.google.com/?q=Joes+Pizza+New+York',
      '2. Katz\'s Delicatessen',
      'Address: 205 E Houston St, New York, NY',
      'Why it fits the itinerary: Famous restaurant for a food tour.',
      'Google Maps Link: https://maps.google.com/?q=Katzs+Delicatessen',
      '3. Magnolia Bakery',
      'Address: 401 Bleecker St, New York, NY',
      'Why it fits the itinerary: Popular dessert location.',
      'Google Maps Link: https://maps.google.com/?q=Magnolia+Bakery'
    ].join('\n');
  } else if (lowerMessage.includes('itinerary')) {
    reply = [
      'Travel Itinerary:',
      '1. Central Park',
      'Address: New York, NY',
      'Why it fits the itinerary: A major destination for a one-day visit.',
      'Google Maps Link: https://maps.google.com/?q=Central+Park',
      '2. Times Square',
      'Address: Manhattan, NY',
      'Why it fits the itinerary: Iconic sightseeing location.',
      'Google Maps Link: https://maps.google.com/?q=Times+Square',
      '3. Bryant Park',
      'Address: New York, NY',
      'Why it fits the itinerary: Easy stop near other destinations.',
      'Google Maps Link: https://maps.google.com/?q=Bryant+Park'
    ].join('\n');
  } else if (lowerMessage.includes('replace') && lowerMessage.includes('park')) {
    reply = [
      'Updated Travel Itinerary:',
      '1. Central Park',
      'Address: New York, NY',
      'Why it fits the itinerary: This park replaces the cafe.',
      'Google Maps Link: https://maps.google.com/?q=Central+Park',
      '2. Bryant Park',
      'Address: New York, NY',
      'Why it fits the itinerary: Another convenient park stop.',
      'Google Maps Link: https://maps.google.com/?q=Bryant+Park',
      '3. Washington Square Park',
      'Address: New York, NY',
      'Why it fits the itinerary: A lively public park.',
      'Google Maps Link: https://maps.google.com/?q=Washington+Square+Park'
    ].join('\n');
  } else if (lowerMessage.includes('haiku')) {
    reply = 'A short haiku response generated for the selected model.';
  } else if (lowerMessage.includes('horror story')) {
    reply = 'A two sentence horror story generated for the selected model.';
  }

  return { [model]: reply };
}

async function waitForLastAiMessage() {
  await page.waitForFunction(() => {
    const messages = document.querySelectorAll('.chat-row.ai');
    const lastMessage = messages[messages.length - 1];
    return lastMessage && lastMessage.innerText.trim().length > 0;
  }, { timeout: 30000 });

  return page.$$eval('.chat-row.ai', elements => elements[elements.length - 1].innerText.trim());
}

BeforeAll(async function () {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on('request', request => {
    const requestUrl = new URL(request.url());

    if (request.method() === 'POST' && requestUrl.pathname === '/api/chat') {
      const body = JSON.parse(request.postData() || '{}');

      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: mockChatReply(body.message || '', body.selectedModels || [])
        })
      });
      return;
    }

    request.continue();
  });

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

Given('I am logged into the dashboard', async function () {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.setItem("loggedInUserEmail", "test@example.com");
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });

  await page.waitForSelector('#modelSelect');
  await page.waitForSelector('#userInput');
  await page.waitForSelector('#sendBtn');
  await page.waitForSelector('#chat-box');
});

When('I select {string} from the model selection menu', async function (modelName) {
  const modelValue = modelLabels[modelName] || modelName.toLowerCase();
  await page.select('#modelSelect', modelValue);

  const selectedValue = await page.$eval('#modelSelect', element => element.value);
  assert.strictEqual(selectedValue, modelValue);
});

When('I send the message {string}', async function (message) {
  await page.click('#userInput', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#userInput', message);
  await page.click('#sendBtn');
});

When('I ask {string}', async function (message) {
  await page.click('#userInput', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#userInput', message);
  await page.click('#sendBtn');
});

Given('I have generated a itinerary', async function () {
  await page.click('#userInput', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#userInput', 'Create a food tour itinerary in Manhattan');
  await page.click('#sendBtn');

  const responseText = await waitForLastAiMessage();
  assert(responseText.includes('Travel Itinerary'));
});

Then('the response should be generated by the Llama model', async function () {
  const responseText = await waitForLastAiMessage();
  assert(responseText.includes('Model: llama3.2'));
});

Then('the response should be generated by the GPT model', async function () {
  const responseText = await waitForLastAiMessage();
  assert(responseText.includes('Model: gpt'));
});

Then('the response should be generated by the Gemma model', async function () {
  const responseText = await waitForLastAiMessage();
  assert(responseText.includes('Model: gemma'));
});

Then('the system should generate a list of destinations', async function () {
  const responseText = await waitForLastAiMessage();
  assert(responseText.includes('Travel Itinerary'));
  assert(responseText.includes('Central Park'));
  assert(responseText.includes('Times Square'));
  assert(responseText.includes('Bryant Park'));
});

Then('the itinerary should include at least three locations', async function () {
  const responseText = await waitForLastAiMessage();
  const locationCount = (responseText.match(/\n[123]\./g) || []).length;
  assert(locationCount >= 3);
});

Then('the itinerary should contain recommended restaurants', async function () {
  const responseText = await waitForLastAiMessage();
  assert(responseText.includes('Joe\'s Pizza'));
  assert(responseText.includes('Katz\'s Delicatessen'));
  assert(responseText.includes('Magnolia Bakery'));
});

Then('the itinerary should include Google Maps links for each location', async function () {
  const responseText = await waitForLastAiMessage();
  const mapsLinkCount = (responseText.match(/https:\/\/maps\.google\.com\/\?q=/g) || []).length;
  assert(mapsLinkCount >= 3);
});

Then('the itinerary should update with a park', async function () {
  const responseText = await waitForLastAiMessage();
  assert(responseText.includes('Updated Travel Itinerary'));
  assert(responseText.toLowerCase().includes('park'));
});
