import { createError } from '@fastify/error';
import type { FastifySchemaValidationError } from 'fastify/types/schema';
import type { ZodError } from 'zod/v4';
import type * as core from 'zod/v4/core';

export class RequestValidationError
  extends Error
  implements FastifySchemaValidationError
{
  cause!: core.$ZodIssue;
  constructor(
    public keyword: core.$ZodIssueCode,
    public instancePath: string,
    public schemaPath: string,
    public message: string,
    public params: { issue: core.$ZodIssue; error: ZodError },
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
    super();
    this.cause = options.cause;
  }
}
