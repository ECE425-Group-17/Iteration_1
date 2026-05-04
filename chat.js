require('dotenv').config();

const OpenAI = require('openai');
const { GoogleGenAI } = require('@google/genai');
const Anthropic = require('@anthropic-ai/sdk');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const OLLAMA_URL = 'http://127.0.0.1:11434';

async function determineLocationIntent(message) {
  const prompt = `Analyze the following message to determine if it is asking for travel recommendations, an itinerary, or information about a specific real-world location.
Fictional locations (e.g., Hogwarts, Gotham, Tatooine) or general chat (e.g., "Hi", "Thanks", "How are you?") MUST return false for needsSearch.

Respond ONLY with a valid JSON object in this exact format:
{
  "needsSearch": boolean,
  "searchQuery": "The specific real-world place or city to search for, or null if no search is needed",
  "isFictional": boolean
}

Message: "${message}"`;

  try {
    const responseText = await GoogleGenAI(prompt);
    
    const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("Intent parsing failed:", err);
    return { needsSearch: false, searchQuery: null, isFictional: false };
  }
}

async function searchGooglePlaces(userMessage) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.googleMapsUri,places.types"
    },
    body: JSON.stringify({
      textQuery: userMessage
    })
  });

  if (!response.ok) {
    throw new Error(`Google Places error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.places || [];
}

async function callOllama(model, prompt) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error for ${model}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

async function callGPT(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  });

  return response.choices[0].message.content;
}

async function callGemini(prompt) {
  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  return response.text;
}

async function callClaude(prompt) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}

async function callSelectedModel(model, prompt) {
  if (model === 'gpt') {
    return callGPT(prompt);
  }

  if (model === 'gemini') {
    return callGemini(prompt);
  }

  if (model === 'claude') {
    return callClaude(prompt);
  }

  return callOllama(model, prompt);
}

async function handleChat(userMessage, selectedModels = null) {
  try {
    const intent = await determineLocationIntent(userMessage);

    let places = [];
    let topPlaces = [];

    if (intent.needsSearch && intent.searchQuery) {
      places = await searchGooglePlaces(intent.searchQuery);
      topPlaces = places.slice(0, 5);
    }

    const isItineraryRequest =
      userMessage.toLowerCase().includes("itinerary") ||
      userMessage.toLowerCase().includes("plan my day") ||
      userMessage.toLowerCase().includes("day plan") ||
      userMessage.toLowerCase().includes("tour");

    let finalPrompt = "";

    if (intent.isFictional) {
      finalPrompt = `The user is asking about a fictional location: "${userMessage}". 
      Playfully let them know that this place exists only in fiction, and offer to help them find a real-world destination with a similar vibe.`;
      
    } else if (!intent.needsSearch) {
      finalPrompt = `You are a helpful travel assistant. The user said: "${userMessage}". 
      Respond to them naturally. If they are just saying hello or making small talk, greet them and ask how you can help them plan their next trip.`;
      
    } else {
      const ragPrompt = `
You are a destination recommendation assistant.

The user asked:
${userMessage}

Use ONLY the real Google Places results below. Do not make up places.
Google Places results:
${JSON.stringify(places, null, 2)}

Your answer must include:
1. Recommended Destination
2. Address
3. Rating if available
4. Why this place matches the user's request
5. Google Maps Link
`;

      const itineraryPrompt = `
You are a travel itinerary planner.

The user asked:
${userMessage}

Use ONLY the real Google Places results below. Do not make up places.
Google Places results:
${JSON.stringify(topPlaces, null, 2)}

Your answer must include:
1. At least 3 destinations
2. For each destination:
   - Name
   - Address
   - Rating if available
   - Why it fits the itinerary
   - Google Maps Link

Format it clearly as:
Travel Itinerary:
1. ...
2. ...
3. ...
`;

      finalPrompt = isItineraryRequest ? itineraryPrompt : ragPrompt;
    }

    if (!selectedModels || selectedModels.length === 0) {
      return await callOllama('gemma4:e4b', finalPrompt);
    }

    const responses = {};

    for (const model of selectedModels) {
      try {
        responses[model] = await callSelectedModel(model, finalPrompt);
      } catch (err) {
        responses[model] = `Error from ${model}: ${err.message}`;
      }
    }

    return responses;
  } catch (err) {
    console.error(err.message);
    throw new Error(`Unable to complete destination recommendation. ${err.message}`);
  }
}

module.exports = { handleChat };