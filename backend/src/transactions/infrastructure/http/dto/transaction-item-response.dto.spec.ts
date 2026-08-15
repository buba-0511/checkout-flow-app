import { TransactionItem } from '../../../domain/transaction.entity';
import { TransactionItemResponseDto } from './transaction-item-response.dto';

describe('TransactionItemResponseDto.fromDomain', () => {
  it('maps every field from the domain item', () => {
    const item = new TransactionItem('i1', 'p1', 2, 1000, 2000);

    const dto = TransactionItemResponseDto.fromDomain(item);

    expect(dto).toEqual({
      id: 'i1',
      productId: 'p1',
      quantity: 2,
      unitPriceInCents: 1000,
      subtotalInCents: 2000,
    });
  });
});
