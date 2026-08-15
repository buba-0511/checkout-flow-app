import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { unwrap } from '../../../common/errors/api-exception';
import { FindOrCreateCustomerUseCase } from '../../application/use-cases/find-or-create-customer.use-case';
import { GetCustomerByIdUseCase } from '../../application/use-cases/get-customer-by-id.use-case';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly findOrCreateCustomerUseCase: FindOrCreateCustomerUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Find an existing customer by legalId, or create a new one.',
  })
  @ApiResponse({ status: 201, type: CustomerResponseDto })
  async findOrCreate(
    @Body() dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = unwrap(await this.findOrCreateCustomerUseCase.execute(dto));
    return CustomerResponseDto.fromDomain(customer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single customer by id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CustomerResponseDto> {
    const customer = unwrap(await this.getCustomerByIdUseCase.execute(id));
    return CustomerResponseDto.fromDomain(customer);
  }
}
