import { Delivery } from '../../../domain/delivery.entity';
import { DeliveryResponseDto } from './delivery-response.dto';

describe('DeliveryResponseDto.fromDomain', () => {
  it('maps every field from the domain delivery', () => {
    const delivery = new Delivery(
      'd1',
      'c1',
      'Calle 123 #45-67',
      'Bogotá',
      'Cundinamarca',
    );

    const dto = DeliveryResponseDto.fromDomain(delivery);

    expect(dto).toEqual({
      id: 'd1',
      customerId: 'c1',
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      region: 'Cundinamarca',
    });
  });
});
