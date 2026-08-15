export enum LegalIdType {
  CC = 'CC',
  CE = 'CE',
  NIT = 'NIT',
  PASSPORT = 'PASSPORT',
}

// Plain domain model — no ORM decorators. See
// infrastructure/persistence/customer.orm-entity.ts for the TypeORM shape.
export class Customer {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly legalId: string,
    public readonly legalIdType: LegalIdType,
  ) {}
}
