export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
  ERROR = 'ERROR',
}

// Purely informational — see project memory on the checkout scope decision.
// Never branched on in use-case logic; both entry points produce the exact
// same items[] shape.
export enum TransactionSource {
  BUY_NOW = 'BUY_NOW',
  CART = 'CART',
}

// A line within a Transaction — not its own aggregate, no repository of its
// own. unitPriceInCents is captured at checkout time from the product's
// real price (never trusted from the client), so it stays correct even if
// the product's price changes later.
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

  // Builds a brand-new PENDING transaction, computing subtotal/total from
  // items + fees here so that invariant can never drift out of sync with
  // what's actually in `items` — callers never compute totals themselves.
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

  // Rebuilds a Transaction exactly as persisted — used only by
  // transaction.mapper.ts. Unlike create(), trusts the given status/total
  // fields as-is instead of recomputing them.
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

  // Only a PENDING transaction can be resolved. Guards against a
  // duplicate/late webhook delivery flipping an already-resolved
  // transaction to a different status.
  resolve(status: TransactionStatus): void {
    if (this._status !== TransactionStatus.PENDING) {
      throw new Error(
        `Cannot resolve transaction "${this.id}" — already ${this._status}.`,
      );
    }
    this._status = status;
  }
}
