// utils/generateCollabId.js
//
// Generates a unique Collab ID in the format: GC-YY XXXX
// e.g. GC-26A3UB, GC-26828K, GC-26H29T (for year 2026)
//
// - GC- : fixed prefix, identifies this as a GoodCreator collab reference
// - YY  : last 2 digits of the current year
// - XXXX: 4 random characters from a 32-character set (A-Z minus I/O,
//         0-9 minus 0/1) — excludes visually-confusing characters since
//         these IDs are read and typed by real people
//
// Uniqueness is enforced two ways:
//   1. This function checks the database before returning a candidate ID,
//      retrying with a new random draw on the rare chance of a collision.
//   2. The field this gets saved into also has a unique index at the
//      schema level, as a hard guarantee even under a race condition.
const Message = require('../models/Message');

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1

const randomSegment = (length) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return result;
};

const generateCollabId = async () => {
  const year = new Date().getFullYear().toString().slice(-2);

  // practically this will succeed on the very first try almost every time
  // (1M+ combinations per year) — the loop exists purely as a correctness
  // guarantee, not because collisions are expected to be common
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidateId = `GC-${year}${randomSegment(4)}`;

    const existing = await Message.findOne({
      'paymentRequest.collabId': candidateId,
    }).select('_id');

    if (!existing) {
      return candidateId;
    }
    // collision found (extremely unlikely) — loop again with a fresh draw
  }

  throw new Error('Failed to generate a unique collab ID after multiple attempts');
};

module.exports = generateCollabId;
