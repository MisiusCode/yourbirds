import { Store } from 'express-session';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE_SESSIONS } from './dynamodb.js';

export class DynamoDBSessionStore extends Store {
  async get(sid, callback) {
    try {
      const { Item } = await db.send(new GetCommand({
        TableName: TABLE_SESSIONS,
        Key: { id: sid },
      }));
      if (!Item) return callback(null, null);
      if (Item.expires && Item.expires < Date.now()) return callback(null, null);
      callback(null, Item.sess);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid, session, callback) {
    try {
      const maxAge = session.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      await db.send(new PutCommand({
        TableName: TABLE_SESSIONS,
        Item: { id: sid, sess: session, expires: Date.now() + maxAge },
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
