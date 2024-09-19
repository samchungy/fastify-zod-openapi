import type { FastifySerializerCompiler } from 'fastify/types/schema';
import type { ZodType } from 'zod';

import { ValidationError } from './validationError';

/**
 * Enables zod-openapi schema response validation
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify'
 *
 * const server = Fastify().setserializerCompiler(serializerCompiler)
 * ```
 */
export const serializerCompiler: FastifySerializerCompiler<ZodType> =
  ({ schema }) =>
  (value) => {
    const result = schema.safeParse(value);

    if (!result.success) {
      throw new ValidationError(result.error, 'response');
    }

    return JSON.stringify(result.data);
  };
