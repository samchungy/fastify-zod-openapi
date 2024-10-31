import { createError } from '@fastify/error';
import type { FastifySchemaValidationError } from 'fastify/types/schema';
import type { ZodError, ZodIssue, ZodIssueCode } from 'zod';

export class RequestValidationError
  extends Error
  implements FastifySchemaValidationError
{
  cause!: ZodIssue;
  constructor(
    public keyword: ZodIssueCode,
    public instancePath: string,
    public schemaPath: string,
    public message: string,
    public params: { issue: ZodIssue; error: ZodError },
  ) {
    super(message, {
      cause: params.issue,
    });
  }
}

export class ResponseSerializationError extends createError(
  'FST_ERR_RESPONSE_SERIALIZATION',
  'Response does not match the schema',
  500,
) {
  cause!: ZodError;
  constructor(
    public method: string,
    public url: string,
    options: { cause: ZodError },
  ) {
    super(options);
  }
}
