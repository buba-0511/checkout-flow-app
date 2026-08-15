import { Result } from './result';

describe('Result', () => {
  describe('ok / err', () => {
    it('isOk() is true and isErr() is false for an Ok result', () => {
      const result = Result.ok<number, string>(42);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });

    it('isOk() is false and isErr() is true for an Err result', () => {
      const result = Result.err<number, string>('failed');
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('value', () => {
    it('returns the wrapped value for an Ok result', () => {
      expect(Result.ok<number, string>(42).value).toBe(42);
    });

    it('throws when reading value of an Err result', () => {
      const result = Result.err<number, string>('failed');
      expect(() => result.value).toThrow('Cannot read value of an Err result');
    });
  });

  describe('error', () => {
    it('returns the wrapped error for an Err result', () => {
      expect(Result.err<number, string>('failed').error).toBe('failed');
    });

    it('throws when reading error of an Ok result', () => {
      const result = Result.ok<number, string>(42);
      expect(() => result.error).toThrow('Cannot read error of an Ok result');
    });
  });

  describe('map', () => {
    it('transforms the value of an Ok result', () => {
      const result = Result.ok<number, string>(2).map((n) => n * 10);
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(20);
    });

    it('does not run the mapper on an Err result', () => {
      const mapper = jest.fn((n: number) => n * 10);
      const result = Result.err<number, string>('failed').map(mapper);
      expect(mapper).not.toHaveBeenCalled();
      expect(result.isErr()).toBe(true);
      expect(result.error).toBe('failed');
    });
  });

  describe('mapErr', () => {
    it('transforms the error of an Err result', () => {
      const result = Result.err<number, string>('failed').mapErr((e) =>
        e.toUpperCase(),
      );
      expect(result.isErr()).toBe(true);
      expect(result.error).toBe('FAILED');
    });

    it('does not run the mapper on an Ok result', () => {
      const mapper = jest.fn((e: string) => e.toUpperCase());
      const result = Result.ok<number, string>(42).mapErr(mapper);
      expect(mapper).not.toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe('andThen', () => {
    it('chains into the next Result when Ok', () => {
      const result = Result.ok<number, string>(2).andThen((n) =>
        Result.ok(n * 10),
      );
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(20);
    });

    it('short-circuits and skips the chained function when Err', () => {
      const chained = jest.fn((n: number) => Result.ok(n * 10));
      const result = Result.err<number, string>('failed').andThen(chained);
      expect(chained).not.toHaveBeenCalled();
      expect(result.isErr()).toBe(true);
      expect(result.error).toBe('failed');
    });

    it('propagates an Err produced mid-chain', () => {
      const result = Result.ok<number, string>(2).andThen(() =>
        Result.err<number, string>('step failed'),
      );
      expect(result.isErr()).toBe(true);
      expect(result.error).toBe('step failed');
    });
  });
});
