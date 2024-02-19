import type { ZodError } from 'zod';

export type ValidationErrorDetails = Record<string, ZodError['issues']>;

export class ValidationError extends Error {
  constructor(
    public zodError: ZodError,
    public httpPart: string | undefined,
  ) {
    super(
      httpPart
        ? JSON.stringify({
            [httpPart]: zodError.issues,
          } satisfies ValidationErrorDetails)
        : zodError.message,
    );
  }
}
