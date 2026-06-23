// Seed Lithuanian bird names into DynamoDB (run once after setting up tables).
// Usage: node backend/scripts/seedBirdNames.js
// For local dev: set AWS_ENDPOINT_URL=http://localhost:8000 before running
// For production: unset AWS_ENDPOINT_URL (uses AWS credential chain)
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
if (!process.env.AWS_REGION || process.env.AWS_REGION === 'local') {
  dotenvConfig({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
}

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { staticNames } from '../services/lithuanianNames.js';

const raw = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
});
const db = DynamoDBDocumentClient.from(raw, { marshallOptions: { removeUndefinedValues: true } });
const TABLE = 'yourbirds-birdnames';

const entries = Object.entries(staticNames);
let seeded = 0;
let skipped = 0;

// Process in batches of 25 (DynamoDB BatchWrite limit)
for (let i = 0; i < entries.length; i += 25) {
  const batch = entries.slice(i, i + 25);
  const requests = [];

  for (const [latin, lt] of batch) {
    const latinName = latin.trim().toLowerCase().replace(/[*_]/g, '');
    // Only write if not already present (avoid overwriting user edits)
    const { Item } = await db.send(new GetCommand({ TableName: TABLE, Key: { latinName } }));
    if (Item) {
      skipped++;
    } else {
      requests.push({ PutRequest: { Item: { latinName, nameLt: lt } } });
      seeded++;
    }
  }

  if (requests.length) {
    await db.send(new BatchWriteCommand({ RequestItems: { [TABLE]: requests } }));
  }
}

console.log(`BirdNames: ${seeded} seeded, ${skipped} already present`);
