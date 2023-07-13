import type { ZodError } from 'zod';

export interface ValidationErrorDetails {
  [httpPart: string]: ZodError['issues'];
}

export class ValidationError extends Error {
  constructor(public zodError: ZodError, public httpPart: string | undefined) {
    super(
      httpPart
        ? JSON.stringify(
            {
              [httpPart]: zodError.issues,
            } satisfies ValidationErrorDetails,
            null,
            2,
          )
        : zodError.message,
    );
  }
}
