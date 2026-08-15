import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { LegalIdType } from '../../../domain/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+573001234567' })
  @IsString()
  @Length(7, 20)
  phone: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  legalId: string;

  @ApiProperty({ enum: LegalIdType, example: LegalIdType.CC })
  @IsEnum(LegalIdType)
  legalIdType: LegalIdType;
}
