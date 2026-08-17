import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateCustomerDto } from '../../../../customers/infrastructure/http/dto/create-customer.dto';
import { TransactionSource } from '../../../domain/transaction.entity';
import { CreateTransactionDeliveryDto } from './create-transaction-delivery.dto';
import { CreateTransactionItemDto } from './create-transaction-item.dto';
import { CreateTransactionPaymentMethodDto } from './create-transaction-payment-method.dto';

export class CreateTransactionDto {
  @ApiProperty({ type: CreateCustomerDto })
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer: CreateCustomerDto;

  @ApiProperty({ type: CreateTransactionDeliveryDto })
  @ValidateNested()
  @Type(() => CreateTransactionDeliveryDto)
  delivery: CreateTransactionDeliveryDto;

  @ApiProperty({ type: [CreateTransactionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];

  @ApiProperty({ enum: TransactionSource, example: TransactionSource.CART })
  @IsEnum(TransactionSource)
  source: TransactionSource;

  @ApiProperty({ type: CreateTransactionPaymentMethodDto })
  @ValidateNested()
  @Type(() => CreateTransactionPaymentMethodDto)
  paymentMethod: CreateTransactionPaymentMethodDto;

  @ApiProperty({
    required: false,
    description:
      'Client-generated UUID, one per checkout attempt. A resubmission (reload/retry) with the same key returns the original transaction instead of creating a duplicate.',
  })
  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;
}
