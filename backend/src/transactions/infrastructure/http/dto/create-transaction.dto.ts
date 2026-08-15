import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { CreateCustomerDto } from '../../../../customers/infrastructure/http/dto/create-customer.dto';
import { TransactionSource } from '../../../domain/transaction.entity';
import { CreateTransactionDeliveryDto } from './create-transaction-delivery.dto';
import { CreateTransactionItemDto } from './create-transaction-item.dto';

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
}
