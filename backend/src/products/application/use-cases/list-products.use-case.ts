import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { Product } from '../../domain/product.entity';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/product.repository';

export interface ListProductsParams {
  cursor?: string;
  limit: number;
}

export interface ProductPage {
  items: Product[];
  // Pass back as `cursor` to fetch the next page. Null once there's nothing left.
  nextCursor: string | null;
}

@Injectable()
export class ListProductsUseCase {
  private readonly logger = new Logger(ListProductsUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    params: ListProductsParams,
  ): Promise<Result<ProductPage, DomainError>> {
    const products = await this.productRepository.findPage(params);

    // We asked for limit + 1 — a full house means there's more beyond this page.
    const hasNextPage = products.length > params.limit;
    const items = hasNextPage ? products.slice(0, params.limit) : products;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    this.logger.debug(
      `Listed ${items.length} product(s), cursor "${params.cursor ?? ''}"`,
    );
    return Result.ok({ items, nextCursor });
  }
}
