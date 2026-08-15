import {
  Transaction,
  TransactionItem,
  TransactionSource,
  TransactionStatus,
} from './transaction.entity';

function makeItems(): TransactionItem[] {
  return [
    new TransactionItem('i1', 'p1', 2, 1000, 2000),
    new TransactionItem('i2', 'p2', 1, 500, 500),
  ];
}

describe('Transaction.create', () => {
  it('computes subtotal from items and total from subtotal + fees', () => {
    const transaction = Transaction.create({
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      source: TransactionSource.CART,
      items: makeItems(),
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
    });

    expect(transaction.subtotalInCents).toBe(2500);
    expect(transaction.totalAmountInCents).toBe(3500);
  });

  it('starts as PENDING with no payment gateway reference', () => {
    const transaction = Transaction.create({
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      source: TransactionSource.BUY_NOW,
      items: makeItems(),
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
    });

    expect(transaction.status).toBe(TransactionStatus.PENDING);
    expect(transaction.paymentGatewayTransactionId).toBeNull();
  });
});

describe('Transaction.reconstitute', () => {
  it('trusts the given status and totals as-is, without recomputing them', () => {
    const transaction = Transaction.reconstitute({
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      status: TransactionStatus.APPROVED,
      source: TransactionSource.CART,
      items: makeItems(),
      subtotalInCents: 999999, // deliberately inconsistent with items — reconstitute must not recompute
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
      totalAmountInCents: 999999,
      paymentGatewayTransactionId: 'gw_123',
    });

    expect(transaction.status).toBe(TransactionStatus.APPROVED);
    expect(transaction.subtotalInCents).toBe(999999);
    expect(transaction.totalAmountInCents).toBe(999999);
    expect(transaction.paymentGatewayTransactionId).toBe('gw_123');
  });
});

describe('Transaction#assignPaymentGatewayReference', () => {
  it('sets the payment gateway transaction id', () => {
    const transaction = Transaction.create({
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      source: TransactionSource.CART,
      items: makeItems(),
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
    });

    transaction.assignPaymentGatewayReference('gw_abc');

    expect(transaction.paymentGatewayTransactionId).toBe('gw_abc');
  });
});

describe('Transaction#resolve', () => {
  it('moves a PENDING transaction to the given status', () => {
    const transaction = Transaction.create({
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      source: TransactionSource.CART,
      items: makeItems(),
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
    });

    transaction.resolve(TransactionStatus.APPROVED);

    expect(transaction.status).toBe(TransactionStatus.APPROVED);
  });

  it('throws when the transaction is already resolved', () => {
    const transaction = Transaction.create({
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      source: TransactionSource.CART,
      items: makeItems(),
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
    });
    transaction.resolve(TransactionStatus.DECLINED);

    expect(() => transaction.resolve(TransactionStatus.APPROVED)).toThrow(
      'Cannot resolve transaction "t1" — already DECLINED.',
    );
  });
});
