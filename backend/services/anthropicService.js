import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { lookupLithuanianName } from './birdNameService.js';

// Node 24's built-in fetch (undici) is blocked by Windows security software;
// node-fetch uses the native https module and is not affected.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, fetch });

// imageBuffer: Buffer (from local file or S3 download)
export async function identifySpecies(imageBuffer) {
  const base64 = imageBuffer.toString('base64');
  // Thumbnails are always generated as JPEG by imageService
  const mediaType = 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 128,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        {
          type: 'text',
          text: 'Identify the bird species in this photo. Reply with only the scientific (Latin) binomial name, e.g. "Parus major". If no bird is visible or it cannot be identified, reply with exactly "Unknown".',
        },
      ],
    }],
  });

  return response.content[0].text.trim();
}

// Returns { name_lt, name_en } — Lithuanian name from the static lookup table,
// English name from AI. If not in table, name_lt is null (user fills it in manually).
export async function getCommonNames(latinName) {
  const name_lt = await lookupLithuanianName(latinName);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 64,
    messages: [{
      role: 'user',
      content: `What is the English common name for the bird species "${latinName}"? Reply with only the common name, nothing else.`,
    }],
  });

  const name_en = response.content[0].text.trim();
  return { name_lt, name_en };
}

export async function enrichBirdData(latinName) {
  const name_lt = await lookupLithuanianName(latinName);

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    tools: [{
      name: 'record_bird_info',
      description: 'Record the English common name and interesting facts for a bird species',
      input_schema: {
        type: 'object',
        properties: {
          name_en: { type: 'string', description: 'English common name for this bird species' },
          facts: {
            type: 'array',
            items: { type: 'string' },
            description: '3 to 5 interesting facts about this bird species, written in English',
          },
          facts_lt: {
            type: 'array',
            items: { type: 'string' },
            description: 'The same 3 to 5 facts translated into Lithuanian (lietuvių kalba)',
          },
        },
        required: ['name_en', 'facts', 'facts_lt'],
      },
    }],
    tool_choice: { type: 'tool', name: 'record_bird_info' },
    messages: [{
      role: 'user',
      content: `For the bird species "${latinName}", provide: the English common name; 3 to 5 interesting facts in English; the same facts translated into Lithuanian. Use the record_bird_info tool.`,
    }],
  });

  const toolUse = response.content.find(c => c.type === 'tool_use');
  if (!toolUse) throw new Error('AI did not return structured data');

  return {
    name_lt,
    name_en: toolUse.input.name_en,
    facts: toolUse.input.facts,
    facts_lt: toolUse.input.facts_lt,
  };
}
