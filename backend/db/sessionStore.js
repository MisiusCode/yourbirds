import { Store } from 'express-session';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE_SESSIONS } from './dynamodb.js';

export class DynamoDBSessionStore extends Store {
  async get(sid, callback) {
    try {
      console.log('[session store] get:', sid);
      const { Item } = await db.send(new GetCommand({
        TableName: TABLE_SESSIONS,
        Key: { id: sid },
      }));
      console.log('[session store] found:', !!Item, 'userId:', Item?.sess?.userId);
      if (!Item) return callback(null, null);
      if (Item.expires && Item.expires < Date.now()) return callback(null, null);
      callback(null, Item.sess);
    } catch (err) {
      console.error('[session store] get error:', err.message);
      callback(err);
    }
  }

  async set(sid, session, callback) {
    try {
      const maxAge = session.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      // JSON round-trip converts Cookie class instance to plain object so DynamoDB can marshall it
      const sess = JSON.parse(JSON.stringify(session));
      await db.send(new PutCommand({
        TableName: TABLE_SESSIONS,
        Item: { id: sid, sess, expires: Date.now() + maxAge },
      }));
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await db.send(new DeleteCommand({
        TableName: TABLE_SESSIONS,
        Key: { id: sid },
      }));
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}
