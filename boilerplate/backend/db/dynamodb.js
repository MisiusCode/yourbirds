import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Table name constants — update these to match your app
export const TABLE_SESSIONS = 'myapp-sessions';
// export const TABLE_USERS = 'myapp-users';
// export const TABLE_ITEMS = 'myapp-items';

const raw = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-north-1',
  // AWS_ENDPOINT_URL=http://localhost:8000 in .env → routes to DynamoDB Local
  ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
});

export const db = DynamoDBDocumentClient.from(raw, {
  marshallOptions: {
    removeUndefinedValues: true, // silently drops undefined fields instead of erroring
  },
});
