import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { unwrap } from '../../../common/errors/api-exception';
import { CreateDeliveryUseCase } from '../../application/use-cases/create-delivery.use-case';
import { GetDeliveryByIdUseCase } from '../../application/use-cases/get-delivery-by-id.use-case';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryResponseDto } from './dto/delivery-response.dto';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(
    private readonly createDeliveryUseCase: CreateDeliveryUseCase,
    private readonly getDeliveryByIdUseCase: GetDeliveryByIdUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a delivery for a customer.' })
  @ApiResponse({ status: 201, type: DeliveryResponseDto })
  async create(
    @Body() dto: CreateDeliveryDto,
  ): Promise<DeliveryResponseDto> {
    const delivery = unwrap(await this.createDeliveryUseCase.execute(dto));
    return DeliveryResponseDto.fromDomain(delivery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single delivery by id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: DeliveryResponseDto })
  @ApiResponse({ status: 404, description: 'Delivery not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeliveryResponseDto> {
    const delivery = unwrap(await this.getDeliveryByIdUseCase.execute(id));
    return DeliveryResponseDto.fromDomain(delivery);
  }
}
