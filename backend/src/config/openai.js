const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'gpt-4o';
const EMBED_MODEL = 'text-embedding-3-small';

module.exports = { openai, MODEL, EMBED_MODEL };
