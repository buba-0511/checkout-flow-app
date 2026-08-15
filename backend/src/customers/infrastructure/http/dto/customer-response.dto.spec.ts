import { Customer, LegalIdType } from '../../../domain/customer.entity';
import { CustomerResponseDto } from './customer-response.dto';

describe('CustomerResponseDto.fromDomain', () => {
  it('maps every field from the domain customer', () => {
    const customer = new Customer(
      'c1',
      'Jane Doe',
      'jane.doe@example.com',
      '+573001234567',
      '1234567890',
      LegalIdType.CC,
    );

    const dto = CustomerResponseDto.fromDomain(customer);

    expect(dto).toEqual({
      id: 'c1',
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+573001234567',
      legalId: '1234567890',
      legalIdType: LegalIdType.CC,
    });
  });
});
