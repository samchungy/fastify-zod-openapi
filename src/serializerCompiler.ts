import type { FastifySerializerCompiler } from 'fastify/types/schema';
import type { AnyZodObject, ZodType } from 'zod';

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
export const serializerCompiler: FastifySerializerCompiler<
  ZodType | { properties: AnyZodObject }
> =
  ({ schema }) =>
  (value) => {
    const result =
      'properties' in schema
        ? schema.properties.safeParse(value)
        : schema.safeParse(value);

    if (!result.success) {
      throw new ValidationError(result.error, 'response');
    }

    return JSON.stringify(result.data);
  };
