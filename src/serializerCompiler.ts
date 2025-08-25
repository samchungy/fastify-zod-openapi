import fastJsonStringify, {
  type ObjectSchema,
  type Schema,
} from 'fast-json-stringify';
import type { FastifySerializerCompiler } from 'fastify/types/schema';
import type { ZodType } from 'zod/v4';
import type { $ZodType } from 'zod/v4/core';
import { createSchema } from 'zod-openapi';
import { createRegistry, isAnyZodType } from 'zod-openapi/api';

import { ResponseSerializationError } from './validationError.js';

export interface SerializerOptions {
  components?: Record<string, $ZodType>;
  stringify?: (value: unknown) => string;
  fallbackSerializer?: FastifySerializerCompiler<$ZodType>;
}

export const createSerializerCompiler =
  (opts?: SerializerOptions): FastifySerializerCompiler<$ZodType> =>
  (routeSchema) => {
    const { schema, url, method } = routeSchema;
    if (!isAnyZodType(schema)) {
      return opts?.fallbackSerializer
        ? opts.fallbackSerializer(routeSchema)
        : fastJsonStringify(schema as unknown as Schema);
    }

    let stringify = opts?.stringify;
    if (!stringify) {
      const { schema: jsonSchema, components } = createSchema(schema, {
        registry: createRegistry({
          schemas: opts?.components,
        }),
        schemaRefPath: '#/definitions/',
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
      const result = (schema as unknown as ZodType).safeParse(value);

      if (!result.success) {
        throw new ResponseSerializationError(method, url, {
          cause: result.error,
        });
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
 * const server = Fastify().setSerializerCompiler(serializerCompiler)
 * ```
 */
export const serializerCompiler = createSerializerCompiler();
