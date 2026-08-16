import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

// Logs every rate-limit trip (OWASP A09:2025 — Security Logging and
// Alerting Failures) before delegating to the default 429 response.
@Injectable()
export class LoggingThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(LoggingThrottlerGuard.name);

  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    this.logTrip(context, detail);
    return super.throwThrottlingException(context, detail);
  }

  logTrip(context: ExecutionContext, detail: ThrottlerLimitDetail): void {
    const req = context
      .switchToHttp()
      .getRequest<{ ip?: string; method: string; url: string }>();
    this.logger.warn(
      `Rate limit exceeded: ${req.method} ${req.url} from ${req.ip} (limit: ${detail.limit}/${detail.ttl}ms)`,
    );
  }
}
