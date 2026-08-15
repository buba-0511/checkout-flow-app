import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let typeOrmHealthIndicator: jest.Mocked<TypeOrmHealthIndicator>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: HealthCheckService, useValue: { check: jest.fn() } },
        {
          provide: TypeOrmHealthIndicator,
          useValue: { pingCheck: jest.fn() },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    healthCheckService = app.get(HealthCheckService);
    typeOrmHealthIndicator = app.get(TypeOrmHealthIndicator);
  });

  describe('checkHealth', () => {
    it('runs a database ping check', async () => {
      const pingResult = { database: { status: 'up' as const } };
      typeOrmHealthIndicator.pingCheck.mockResolvedValue(pingResult);
      healthCheckService.check.mockImplementation(async (indicators) => {
        const results = await Promise.all(
          indicators.map((indicator) => Promise.resolve(indicator())),
        );
        return Object.assign({}, ...results) as never;
      });

      const result = await appController.checkHealth();

      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(result).toEqual(pingResult);
    });
  });
});
