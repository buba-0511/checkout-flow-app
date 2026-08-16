import { randomInt } from 'crypto';

// Excludes 0/O/1/I — avoids ambiguous characters in a reference a customer
// might read over the phone or type into a support ticket.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LENGTH = 8;

// Short, human-friendly order reference shown to the customer and echoed
// back by the gateway's webhook to match the transaction — a raw UUID
// works but reads badly on a receipt. 32^8 (~1.1e12) combinations is far
// more than this app will ever generate, so no collision retry is needed.
// randomInt (not randomBytes % N) — avoids modulo bias on the byte->index map.
export function generateOrderReference(): string {
  let suffix = '';
  for (let i = 0; i < LENGTH; i++) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `ORD-${suffix}`;
}
