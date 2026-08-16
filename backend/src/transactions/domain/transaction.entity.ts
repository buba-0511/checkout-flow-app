export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
  ERROR = 'ERROR',
}

// Purely informational — never branched on in use-case logic.
export enum TransactionSource {
  BUY_NOW = 'BUY_NOW',
  CART = 'CART',
}

// unitPriceInCents is captured at checkout time from the product's real
// price, never trusted from the client.
export class TransactionItem {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly unitPriceInCents: number,
    public readonly subtotalInCents: number,
  ) {}
}

// Plain domain model — no ORM decorators. See
// infrastructure/persistence/transaction.orm-entity.ts for the TypeORM
// shape.
export class Transaction {
  private constructor(
    public readonly id: string,
    public readonly reference: string,
    public readonly customerId: string,
    public readonly deliveryId: string,
    private _status: TransactionStatus,
    public readonly source: TransactionSource,
    public readonly items: TransactionItem[],
    public readonly subtotalInCents: number,
    public readonly baseFeeInCents: number,
    public readonly deliveryFeeInCents: number,
    public readonly totalAmountInCents: number,
    private _paymentGatewayTransactionId: string | null,
  ) {}

  // Computes subtotal/total from items + fees so callers never do it themselves.
  static create(params: {
    id: string;
    reference: string;
    customerId: string;
    deliveryId: string;
    source: TransactionSource;
    items: TransactionItem[];
    baseFeeInCents: number;
    deliveryFeeInCents: number;
  }): Transaction {
    const subtotalInCents = params.items.reduce(
      (sum, item) => sum + item.subtotalInCents,
      0,
    );
    const totalAmountInCents =
      subtotalInCents + params.baseFeeInCents + params.deliveryFeeInCents;

    return new Transaction(
      params.id,
      params.reference,
      params.customerId,
      params.deliveryId,
      TransactionStatus.PENDING,
      params.source,
      params.items,
      subtotalInCents,
      params.baseFeeInCents,
      params.deliveryFeeInCents,
      totalAmountInCents,
      null,
    );
  }

  // Rebuilds from persistence, trusting the given fields instead of recomputing them.
  static reconstitute(params: {
    id: string;
    reference: string;
    customerId: string;
    deliveryId: string;
    status: TransactionStatus;
    source: TransactionSource;
    items: TransactionItem[];
    subtotalInCents: number;
    baseFeeInCents: number;
    deliveryFeeInCents: number;
    totalAmountInCents: number;
    paymentGatewayTransactionId: string | null;
  }): Transaction {
    return new Transaction(
      params.id,
      params.reference,
      params.customerId,
      params.deliveryId,
      params.status,
      params.source,
      params.items,
      params.subtotalInCents,
      params.baseFeeInCents,
      params.deliveryFeeInCents,
      params.totalAmountInCents,
      params.paymentGatewayTransactionId,
    );
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get paymentGatewayTransactionId(): string | null {
    return this._paymentGatewayTransactionId;
  }

  // Set once the gateway acknowledges the transaction it was sent — before
  // any webhook has resolved a final status.
  assignPaymentGatewayReference(paymentGatewayTransactionId: string): void {
    this._paymentGatewayTransactionId = paymentGatewayTransactionId;
  }

  // Guards against a duplicate/late webhook flipping an already-resolved transaction.
  resolve(status: TransactionStatus): void {
    if (this._status !== TransactionStatus.PENDING) {
      throw new Error(
        `Cannot resolve transaction "${this.id}" — already ${this._status}.`,
      );
    }
    this._status = status;
  }
}
