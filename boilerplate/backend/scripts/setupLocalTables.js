/**
 * Creates all DynamoDB tables in DynamoDB Local.
 * Run once after starting DynamoDB Local:
 *
 *   docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local
 *   node boilerplate/backend/scripts/setupLocalTables.js
 *
 * Tables persist in the container until it is deleted.
 * Safe to re-run — existing tables are silently skipped.
 */

import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'eu-north-1',
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

const tables = [
  {
    TableName: 'myapp-sessions',
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'myapp-users',
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  // Add more tables here following the same pattern
];

for (const tableDefinition of tables) {
  try {
    await client.send(new CreateTableCommand(tableDefinition));
    console.log(`Created ${tableDefinition.TableName}`);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log(`${tableDefinition.TableName} already exists`);
    } else {
      console.error(`Failed to create ${tableDefinition.TableName}:`, err.message);
      process.exit(1);
    }
  }
}

console.log('All tables ready.');
