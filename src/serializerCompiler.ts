import type { FastifySerializerCompiler } from 'fastify/types/schema';
import type { ZodType } from 'zod';

import { ResponseSerializationError } from './validationError';

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
  ({ schema, url, method }) =>
  (value) => {
    const result = schema.safeParse(value);

    if (!result.success) {
      throw new ResponseSerializationError(method, url, {
        cause: result.error,
      });
    }

    return JSON.stringify(result.data);
  };
