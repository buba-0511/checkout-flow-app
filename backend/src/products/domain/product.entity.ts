// Plain domain model — no ORM decorators, no framework dependencies.
// This is what use cases and the domain layer work with; TypeORM never
// appears here (see infrastructure/persistence/product.orm-entity.ts).
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly priceInCents: number,
    private _stock: number,
    public readonly imageUrl: string,
  ) {}

  get stock(): number {
    return this._stock;
  }

  hasEnoughStock(quantity: number): boolean {
    return this._stock >= quantity;
  }

  // Callers always guard with hasEnoughStock() first and turn insufficient
  // stock into a DomainError before reaching this — throwing here means a
  // programming error, not a business-rule failure.
  decreaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('quantity must be positive');
    }
    if (!this.hasEnoughStock(quantity)) {
      throw new Error(`Cannot decrease stock of "${this.name}" below zero`);
    }
    this._stock -= quantity;
  }
}
