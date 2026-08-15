import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps the handler result in { success: true, data }', async () => {
    const interceptor = new ResponseInterceptor<{ id: string }>();
    const callHandler: CallHandler = {
      handle: () => of({ id: 'abc' }),
    };

    const result = await firstValueFrom(
      interceptor.intercept({} as ExecutionContext, callHandler),
    );

    expect(result).toEqual({ success: true, data: { id: 'abc' } });
  });

  it('preserves falsy but defined data values', async () => {
    const interceptor = new ResponseInterceptor<number>();
    const callHandler: CallHandler = { handle: () => of(0) };

    const result = await firstValueFrom(
      interceptor.intercept({} as ExecutionContext, callHandler),
    );

    expect(result).toEqual({ success: true, data: 0 });
  });
});
