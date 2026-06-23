import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const TABLE_USERS   = 'yourbirds-users';
export const TABLE_PHOTOS  = 'yourbirds-photos';
export const TABLE_VOTES   = 'yourbirds-votes';
export const TABLE_BIRDS   = 'yourbirds-birdnames';
export const TABLE_SESSIONS = 'yourbirds-sessions';

const raw = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
});

export const db = DynamoDBDocumentClient.from(raw, {
  marshallOptions: { removeUndefinedValues: true },
});
