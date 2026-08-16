import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionEventsPort } from '../../application/ports/transaction-events.port';
import { TransactionResponseDto } from '../http/dto/transaction-response.dto';

// One room per transaction id — a client subscribes right after creating a
// PENDING transaction, and gets pushed the final status once the webhook
// resolves it, instead of polling GET /transactions/:id.
@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN ?? 'https://localhost:5173')
      .split(',')
      .map((origin) => origin.trim()),
  },
})
export class TransactionsGateway implements TransactionEventsPort {
  private readonly logger = new Logger(TransactionsGateway.name);

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() transactionId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    void client.join(transactionId);
  }

  publishStatusUpdate(transaction: Transaction): void {
    this.server
      .to(transaction.id)
      .emit(
        'transaction:update',
        TransactionResponseDto.fromDomain(transaction),
      );
    this.logger.debug(
      `Published status update for transaction "${transaction.id}" to room subscribers`,
    );
  }
}
