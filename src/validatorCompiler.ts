import type { FastifySchemaCompiler } from 'fastify';
import type { ZodType } from 'zod';

import { ValidationError } from './validatonError';

/**
 * Enables zod-openapi schema validation
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify'
 *
 * const server = Fastify().setValidatorCompiler(validatorCompiler)
 * ```
 */
export const validatorCompiler: FastifySchemaCompiler<ZodType> =
  ({ schema, httpPart }) =>
  (value) => {
    const result = schema.safeParse(value);

    if (!result.success) {
      return { error: new ValidationError(result.error, httpPart) };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { value: result.data };
  };
