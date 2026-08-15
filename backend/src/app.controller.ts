import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller()
export class AppController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness/readiness check — process up and DB reachable.',
  })
  @ApiResponse({ status: 200, description: 'Healthy.' })
  @ApiResponse({
    status: 503,
    description: 'Unhealthy — a dependency check failed.',
  })
  checkHealth() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
