import fastJsonStringify, {
  type ObjectSchema,
  type Schema,
} from 'fast-json-stringify';
import type { FastifySerializerCompiler } from 'fastify/types/schema';
import type { ZodType, ZodTypeAny } from 'zod';
import { createSchema } from 'zod-openapi';

import { ValidationError } from './validationError';

export interface SerializerOptions {
  components?: Record<string, ZodTypeAny>;
  stringify?: (value: unknown) => string;
}

export const createSerializerCompiler =
  (opts?: SerializerOptions): FastifySerializerCompiler<ZodType> =>
  ({ schema }) => {
    let stringify = opts?.stringify;
    if (!stringify) {
      const { schema: jsonSchema, components } = createSchema(schema, {
        components: opts?.components,
        componentRefPath: '#/definitions/',
      });

      const maybeDefinitions: Pick<ObjectSchema, 'definitions'> | undefined =
        components
          ? {
              definitions: components as Record<string, Schema>,
            }
          : undefined;

      stringify = fastJsonStringify({
        ...(jsonSchema as Schema),
        ...maybeDefinitions,
      });
    }

    return (value) => {
      const result = schema.safeParse(value);

      if (!result.success) {
        throw new ValidationError(result.error, 'response');
      }

      return stringify(result.data);
    };
  };

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
export const serializerCompiler = createSerializerCompiler();
