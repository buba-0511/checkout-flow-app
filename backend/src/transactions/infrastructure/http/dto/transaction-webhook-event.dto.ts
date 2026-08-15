import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { TransactionStatus } from '../../../domain/transaction.entity';

// Placeholder shape — not yet the real payment gateway webhook payload
// format. TODO: align this with the gateway's actual event envelope
// (event type, signature header, nested data.transaction.*) once the real
// adapter is built; see [[project-payment-webhook-decision]].
export class TransactionWebhookEventDto {
  @ApiProperty()
  @IsString()
  reference: string;

  @ApiProperty({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}
