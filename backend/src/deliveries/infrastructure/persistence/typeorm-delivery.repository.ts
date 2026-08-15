import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { DeliveryMapper } from './delivery.mapper';
import { DeliveryOrmEntity } from './delivery.orm-entity';

@Injectable()
export class TypeOrmDeliveryRepository implements DeliveryRepository {
  constructor(
    @InjectRepository(DeliveryOrmEntity)
    private readonly repo: Repository<DeliveryOrmEntity>,
  ) {}

  async findById(id: string): Promise<Delivery | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? DeliveryMapper.toDomain(entity) : null;
  }

  async save(delivery: Delivery): Promise<void> {
    await this.repo.save(DeliveryMapper.toOrm(delivery));
  }
}
