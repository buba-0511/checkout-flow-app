import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

// Card token from client-side tokenization (browser -> gateway, public
// key) — this backend never receives raw card data.
export class CreateTransactionPaymentMethodDto {
  @ApiProperty({ example: 'tok_stagtest_...' })
  @IsString()
  cardToken: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  installments: number;
}
