import { Delivery } from './delivery.entity';

// The port — implemented by
// infrastructure/persistence/typeorm-delivery.repository.ts.
export interface DeliveryRepository {
  findById(id: string): Promise<Delivery | null>;
  save(delivery: Delivery): Promise<void>;
}

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');
