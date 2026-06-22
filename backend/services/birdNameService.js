import BirdName from '../models/BirdName.js';
import { staticNames } from './lithuanianNames.js';

function normalise(latinName) {
  return latinName.trim().toLowerCase().replace(/[*_]/g, '');
}

// Called once on startup — inserts static entries that are not yet in the DB.
// Uses $setOnInsert so user-edited values are never overwritten by the seed.
export async function seedBirdNames() {
  const ops = Object.entries(staticNames).map(([latin, lt]) => ({
    updateOne: {
      filter: { latinName: latin },
      update: { $setOnInsert: { latinName: latin, nameLt: lt } },
      upsert: true,
    },
  }));
  if (ops.length) {
    const result = await BirdName.bulkWrite(ops, { ordered: false });
    console.log(`BirdNames: ${result.upsertedCount} seeded, ${result.matchedCount} already present`);
  }
}

// DB-first lookup; returns null for unknown species.
export async function lookupLithuanianName(latinName) {
  if (!latinName) return null;
  const entry = await BirdName.findOne({ latinName: normalise(latinName) });
  return entry?.nameLt || null;
}

// Persist a user-corrected Lithuanian name. Creates entry if species was unknown.
export async function updateLithuanianName(latinName, nameLt) {
  if (!latinName || !nameLt?.trim()) return;
  await BirdName.findOneAndUpdate(
    { latinName: normalise(latinName) },
    { latinName: normalise(latinName), nameLt: nameLt.trim() },
    { upsert: true, new: true }
  );
}
