// Plain domain model — no ORM decorators. See
// infrastructure/persistence/delivery.orm-entity.ts for the TypeORM shape.
export class Delivery {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly address: string,
    public readonly city: string,
    public readonly region: string,
  ) {}
}
