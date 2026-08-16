import { ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerLimitDetail, ThrottlerStorage } from '@nestjs/throttler';
import { LoggingThrottlerGuard } from './logging-throttler.guard';

function makeContext(req: {
  ip?: string;
  method: string;
  url: string;
}): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

const detail: ThrottlerLimitDetail = {
  limit: 10,
  ttl: 60_000,
  key: 'some-key',
  tracker: '127.0.0.1',
  totalHits: 11,
  timeToExpire: 30,
  isBlocked: false,
  timeToBlockExpire: 0,
};

describe('LoggingThrottlerGuard#logTrip', () => {
  it('logs the offending request method, url, ip, and limit', () => {
    const guard = new LoggingThrottlerGuard(
      [],
      {} as ThrottlerStorage,
      new Reflector(),
    );
    const logSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const context = makeContext({
      ip: '127.0.0.1',
      method: 'POST',
      url: '/transactions',
    });

    guard.logTrip(context, detail);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'POST /transactions from 127.0.0.1 (limit: 10/60000ms)',
      ),
    );

    logSpy.mockRestore();
  });
});
