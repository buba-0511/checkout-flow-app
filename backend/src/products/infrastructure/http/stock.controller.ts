import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { unwrap } from '../../../common/errors/api-exception';
import { GetStockUseCase } from '../../application/use-cases/get-stock.use-case';
import { StockResponseDto } from './dto/stock-response.dto';

// Stock as its own resource, separate from the products CRUD — the
// checkout flow needs to be able to check/update availability without
// that logic being buried inside a generic products endpoint.
@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly getStockUseCase: GetStockUseCase) {}

  @Get(':productId')
  @ApiOperation({ summary: 'Check current stock for a single product.' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiResponse({ status: 200, type: StockResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<StockResponseDto> {
    const level = unwrap(await this.getStockUseCase.execute(productId));
    return StockResponseDto.fromDomain(level);
  }
}
