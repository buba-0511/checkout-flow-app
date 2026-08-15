import { ApiProperty } from '@nestjs/swagger';
import { Customer, LegalIdType } from '../../../domain/customer.entity';

export class CustomerResponseDto {
  @ApiProperty({ example: 'b3f1c2a4-5e6d-4f7a-8b9c-0d1e2f3a4b5c', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email: string;

  @ApiProperty({ example: '+573001234567' })
  phone: string;

  @ApiProperty({ example: '1234567890' })
  legalId: string;

  @ApiProperty({ enum: LegalIdType, example: LegalIdType.CC })
  legalIdType: LegalIdType;

  static fromDomain(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.id = customer.id;
    dto.fullName = customer.fullName;
    dto.email = customer.email;
    dto.phone = customer.phone;
    dto.legalId = customer.legalId;
    dto.legalIdType = customer.legalIdType;
    return dto;
  }
}
