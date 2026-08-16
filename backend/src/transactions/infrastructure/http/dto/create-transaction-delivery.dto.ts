import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Same fields as deliveries/.../create-delivery.dto.ts minus customerId —
// CreateTransactionUseCase supplies that itself once it resolves the
// customer, so it isn't something the client submits here.
export class CreateTransactionDeliveryDto {
  @ApiProperty({ example: 'Calle 123 #45-67' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Cundinamarca' })
  @IsString()
  @IsNotEmpty()
  region: string;
}
