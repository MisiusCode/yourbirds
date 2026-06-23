import { db, TABLE_BIRDS } from '../db/dynamodb.js';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

function normalise(latinName) {
  return latinName.trim().toLowerCase().replace(/[*_]/g, '');
}

export async function lookupLithuanianName(latinName) {
  if (!latinName) return null;
  const { Item } = await db.send(new GetCommand({
    TableName: TABLE_BIRDS,
    Key: { latinName: normalise(latinName) },
  }));
  return Item?.nameLt || null;
}

export async function updateLithuanianName(latinName, nameLt) {
  if (!latinName || !nameLt?.trim()) return;
  await db.send(new PutCommand({
    TableName: TABLE_BIRDS,
    Item: { latinName: normalise(latinName), nameLt: nameLt.trim(), updatedAt: new Date().toISOString() },
  }));
}
