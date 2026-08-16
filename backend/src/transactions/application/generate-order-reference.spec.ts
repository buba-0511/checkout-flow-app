import { generateOrderReference } from './generate-order-reference';

describe('generateOrderReference', () => {
  it('produces an ORD-prefixed 8-character uppercase alphanumeric reference', () => {
    const reference = generateOrderReference();
    expect(reference).toMatch(/^ORD-[A-HJ-NP-Z2-9]{8}$/);
  });

  it('is not the same on every call', () => {
    const references = new Set(
      Array.from({ length: 50 }, () => generateOrderReference()),
    );
    expect(references.size).toBe(50);
  });
});
