import { StockResponseDto } from './stock-response.dto';

describe('StockResponseDto.fromDomain', () => {
  it('maps productId and stock', () => {
    const dto = StockResponseDto.fromDomain({ productId: 'p1', stock: 7 });

    expect(dto).toEqual({ productId: 'p1', stock: 7 });
  });
});
