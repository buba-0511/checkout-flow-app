export class Result<T, E> {
  private constructor(
    private readonly ok: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T, E = never>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  static err<T = never, E = unknown>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  isOk(): boolean {
    return this.ok;
  }

  isErr(): boolean {
    return !this.ok;
  }

  get value(): T {
    if (!this.ok) {
      throw new Error('Cannot read value of an Err result');
    }
    return this._value as T;
  }

  get error(): E {
    if (this.ok) {
      throw new Error('Cannot read error of an Ok result');
    }
    return this._error as E;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.ok
      ? Result.ok(fn(this._value as T))
      : Result.err(this._error as E);
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return this.ok
      ? Result.ok(this._value as T)
      : Result.err(fn(this._error as E));
  }

  // chains use cases together — the core of Railway-Oriented Programming:
  // stops at the first Err and short-circuits the rest of the pipeline.
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return this.ok ? fn(this._value as T) : Result.err(this._error as E);
  }
}
