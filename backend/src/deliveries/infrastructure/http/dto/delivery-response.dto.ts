import { ApiProperty } from '@nestjs/swagger';
import { Delivery } from '../../../domain/delivery.entity';

export class DeliveryResponseDto {
  @ApiProperty({ example: 'b3f1c2a4-5e6d-4f7a-8b9c-0d1e2f3a4b5c', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'b3f1c2a4-5e6d-4f7a-8b9c-0d1e2f3a4b5c', format: 'uuid' })
  customerId: string;

  @ApiProperty({ example: 'Calle 123 #45-67' })
  address: string;

  @ApiProperty({ example: 'Bogotá' })
  city: string;

  @ApiProperty({ example: 'Cundinamarca' })
  region: string;

  static fromDomain(delivery: Delivery): DeliveryResponseDto {
    const dto = new DeliveryResponseDto();
    dto.id = delivery.id;
    dto.customerId = delivery.customerId;
    dto.address = delivery.address;
    dto.city = delivery.city;
    dto.region = delivery.region;
    return dto;
  }
}
