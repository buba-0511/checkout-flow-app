import {
  Transaction,
  TransactionItem,
  TransactionSource,
} from '../../domain/transaction.entity';
import { TransactionsGateway } from './transactions.gateway';

function makeTransaction(): Transaction {
  return Transaction.create({
    id: 't1',
    reference: 'ref-1',
    customerId: 'c1',
    deliveryId: 'd1',
    source: TransactionSource.CART,
    items: [new TransactionItem('i1', 'p1', 2, 1000, 2000)],
    baseFeeInCents: 300,
    deliveryFeeInCents: 700,
  });
}

describe('TransactionsGateway', () => {
  it('joins the socket to a room named after the transaction id on subscribe', () => {
    const gateway = new TransactionsGateway();
    const join = jest.fn();
    const client = { join } as unknown as Parameters<
      TransactionsGateway['handleSubscribe']
    >[1];

    gateway.handleSubscribe('t1', client);

    expect(join).toHaveBeenCalledWith('t1');
  });

  it('emits transaction:update to the transaction room with the DTO shape', () => {
    const gateway = new TransactionsGateway();
    const to = jest.fn().mockReturnThis();
    const emit = jest.fn();
    gateway.server = { to, emit } as unknown as TransactionsGateway['server'];
    const transaction = makeTransaction();

    gateway.publishStatusUpdate(transaction);

    expect(to).toHaveBeenCalledWith('t1');
    expect(emit).toHaveBeenCalledWith(
      'transaction:update',
      expect.objectContaining({
        id: 't1',
        reference: 'ref-1',
        status: transaction.status,
      }),
    );
  });
});
