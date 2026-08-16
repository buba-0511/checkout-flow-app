import {
  Transaction,
  TransactionItem,
  TransactionSource,
} from '../../../domain/transaction.entity';
import { TransactionResponseDto } from './transaction-response.dto';

describe('TransactionResponseDto.fromDomain', () => {
  it('maps every field, including nested items, from the domain transaction', () => {
    const transaction = Transaction.create({
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      source: TransactionSource.CART,
      items: [new TransactionItem('i1', 'p1', 2, 1000, 2000)],
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
    });

    const dto = TransactionResponseDto.fromDomain(transaction);

    expect(dto.id).toBe('t1');
    expect(dto.reference).toBe('ref-1');
    expect(dto.customerId).toBe('c1');
    expect(dto.deliveryId).toBe('d1');
    expect(dto.status).toBe(transaction.status);
    expect(dto.source).toBe(TransactionSource.CART);
    expect(dto.items).toEqual([
      {
        id: 'i1',
        productId: 'p1',
        quantity: 2,
        unitPriceInCents: 1000,
        subtotalInCents: 2000,
      },
    ]);
    expect(dto.subtotalInCents).toBe(2000);
    expect(dto.baseFeeInCents).toBe(300);
    expect(dto.deliveryFeeInCents).toBe(700);
    expect(dto.totalAmountInCents).toBe(3000);
    expect(dto.paymentGatewayTransactionId).toBeNull();
  });
});
