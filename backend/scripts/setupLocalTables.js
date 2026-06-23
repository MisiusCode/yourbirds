// Run once after starting DynamoDB Local to create all tables.
// Usage: node backend/scripts/setupLocalTables.js
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
dotenvConfig({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'local',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:8000',
});

const tables = [
  {
    TableName: 'yourbirds-users',
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'googleId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'google-index',
        KeySchema: [{ AttributeName: 'googleId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'yourbirds-photos',
    KeySchema: [{ AttributeName: 'photoId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'photoId', AttributeType: 'S' },
      { AttributeName: 'gsiPk', AttributeType: 'S' },
      { AttributeName: 'gsiSk', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
      { AttributeName: 'groupId', AttributeType: 'S' },
      { AttributeName: 'groupIndex', AttributeType: 'N' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'gallery-index',
        KeySchema: [
          { AttributeName: 'gsiPk', KeyType: 'HASH' },
          { AttributeName: 'gsiSk', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'user-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'group-index',
        KeySchema: [
          { AttributeName: 'groupId', KeyType: 'HASH' },
          { AttributeName: 'groupIndex', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'yourbirds-votes',
    KeySchema: [
      { AttributeName: 'photoId', KeyType: 'HASH' },
      { AttributeName: 'userId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'photoId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'yourbirds-birdnames',
    KeySchema: [{ AttributeName: 'latinName', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'latinName', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'yourbirds-sessions',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

const { TableNames: existing } = await client.send(new ListTablesCommand({}));

for (const table of tables) {
  if (existing.includes(table.TableName)) {
    console.log(`  skip  ${table.TableName} (already exists)`);
    continue;
  }
  await client.send(new CreateTableCommand(table));
  console.log(`created ${table.TableName}`);
}

console.log('Done. All tables ready.');
