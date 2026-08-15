import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { unwrap } from '../../../common/errors/api-exception';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductPageResponseDto } from './dto/product-page-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the product catalog with current stock, cursor-paginated.',
  })
  @ApiResponse({ status: 200, type: ProductPageResponseDto })
  async findAll(
    @Query() query: ListProductsQueryDto,
  ): Promise<ProductPageResponseDto> {
    const page = unwrap(
      await this.listProductsUseCase.execute({
        cursor: query.cursor,
        limit: query.limit,
      }),
    );

    return {
      items: page.items.map((product) =>
        ProductResponseDto.fromDomain(product),
      ),
      nextCursor: page.nextCursor,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    const product = unwrap(await this.getProductByIdUseCase.execute(id));
    return ProductResponseDto.fromDomain(product);
  }
}
