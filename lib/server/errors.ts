// Only deliberately public messages belong in this error type.
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
