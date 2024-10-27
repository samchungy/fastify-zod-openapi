import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifyTypeProvider,
  RawServerBase,
  RawServerDefault,
} from 'fastify';
import fp from 'fastify-plugin';
import type { ZodObject, ZodRawShape, ZodType, z } from 'zod';
import type {
  ZodOpenApiComponentsObject,
  ZodOpenApiParameters,
  ZodOpenApiVersion,
  oas31,
} from 'zod-openapi';
import {
  type ComponentsObject as InternalComponentsObject,
  createMediaTypeSchema,
  createParamOrRef,
  getDefaultComponents,
} from 'zod-openapi/api';

import type { RequestValidationError } from './validationError';

type FastifyResponseSchema = ZodType | Record<string, unknown>;

type FastifySwaggerSchemaObject = Omit<oas31.SchemaObject, 'required'> & {
  required?: string[] | boolean;
};

type FastifyZodOpenApiOpts = {
  openapi?: ZodOpenApiVersion;
  components?: ZodOpenApiComponentsObject;
};

interface FastifyZodOpenApiResults {
  results: {
    body?: FastifySwaggerSchemaObject | oas31.ReferenceObject;
    response?: unknown;
    querystring?: Record<
      string,
      FastifySwaggerSchemaObject | oas31.ReferenceObject
    >;
    params?: Record<string, FastifySwaggerSchemaObject | oas31.ReferenceObject>;
    headers?: Record<
      string,
      FastifySwaggerSchemaObject | oas31.ReferenceObject
    >;
  };
  components: InternalComponentsObject;
}

export const FASTIFY_ZOD_OPENAPI_RESULTS = Symbol(
  'fastify-zod-openapi-results',
);

export const FASTIFY_ZOD_OPENAPI_COMPONENTS = Symbol(
  'fastify-zod-openapi-components',
);

declare module 'fastify' {
  interface FastifySchema {
    [FASTIFY_ZOD_OPENAPI_RESULTS]?: FastifyZodOpenApiResults;
  }

  interface FastifyValidationResult {
    errors?: RequestValidationError[];
  }
}

declare module 'openapi-types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace OpenAPIV3 {
    interface Document {
      [FASTIFY_ZOD_OPENAPI_COMPONENTS]?: InternalComponentsObject;
    }
  }
}

export interface FastifyZodOpenApiTypeProvider extends FastifyTypeProvider {
  validator: this['schema'] extends ZodType ? z.infer<this['schema']> : unknown;
  serializer: this['schema'] extends ZodType
    ? z.input<this['schema']>
    : unknown;
}

export type FastifyZodOpenApi = FastifyPluginAsync<FastifyZodOpenApiOpts>;

export const isZodType = (object: unknown): object is ZodType =>
  Boolean(
    object &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      Object.getPrototypeOf((object as ZodType)?.constructor)?.name ===
        'ZodType',
  );

export const isZodObject = (
  object: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): object is ZodObject<any, any, any, any, any> =>
  Boolean(object && (object as ZodType)?.constructor?.name === 'ZodObject');

export const createParams = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  querystring: ZodObject<any, any, any, any, any>,
  type: keyof ZodOpenApiParameters,
  components: InternalComponentsObject,
  path: string[],
): Record<string, FastifySwaggerSchemaObject | oas31.ReferenceObject> =>
  Object.entries(querystring.shape as ZodRawShape).reduce(
    (acc, [key, value]: [string, ZodType]) => {
      const parameter = createParamOrRef(
        value,
        components,
        [...path, key],
        type,
        key,
      );

      if ('$ref' in parameter || !parameter.schema) {
        throw new Error('References not supported');
      }

      acc[key] = {
        ...parameter.schema,
        ...(parameter.required && { required: true }),
      };

      return acc;
    },
    {} as Record<string, FastifySwaggerSchemaObject | oas31.ReferenceObject>,
  );

export const createResponseSchema = (
  schema: FastifyResponseSchema,
  components: InternalComponentsObject,
  path: string[],
): unknown => {
  if (isZodType(schema)) {
    return createMediaTypeSchema(schema, components, 'output', [
      ...path,
      'schema',
    ]);
  }
  return schema;
};

export const createContent = (
  content: unknown,
  components: InternalComponentsObject,
  path: string[],
): unknown => {
  if (typeof content !== 'object' || content == null) {
    return content;
  }

  return Object.entries(content).reduce(
    (acc, [key, value]: [string, unknown]) => {
      if (typeof value === 'object' && value !== null && 'schema' in value) {
        const schema = createResponseSchema(
          value.schema as FastifyResponseSchema,
          components,
          [...path, 'schema'],
        );
        acc[key] = {
          ...value,
          schema,
        };
        return acc;
      }
      acc[key] = value;
      return acc;
    },
    {} as Record<string, unknown>,
  );
};

export const createResponse = (
  response: unknown,
  components: InternalComponentsObject,
  path: string[],
): unknown => {
  if (typeof response !== 'object' || response == null) {
    return response;
  }

  return Object.entries(response).reduce(
    (acc, [key, value]: [string, unknown]) => {
      if (isZodType(value)) {
        acc[key] = createMediaTypeSchema(value, components, 'output', [
          ...path,
          key,
        ]);
        return acc;
      }

      if (typeof value === 'object' && value !== null && 'content' in value) {
        const content = createContent(value.content, components, [
          ...path,
          'content',
        ]);
        acc[key] = {
          ...value,
          content,
        };
        return acc;
      }

      acc[key] = value;
      return acc;
    },
    {} as Record<string, unknown>,
  );
};

// eslint-disable-next-line @typescript-eslint/require-await
const fastifyZodOpenApi: FastifyZodOpenApi = async (fastify, opts) => {
  const components = getDefaultComponents(opts.components, opts.openapi);

  fastify.addHook('onRoute', ({ schema, url }) => {
    if (!schema || schema.hide) {
      return;
    }

    const transformedSchema: FastifyZodOpenApiResults = {
      results: {},
      components,
    };

    const { response, headers, querystring, body, params } = schema;

    if (isZodType(body)) {
      transformedSchema.results.body = createMediaTypeSchema(
        body,
        components,
        'input',
        [url, 'body'],
      );
    }

    const maybeResponse = createResponse(response, components, [
      url,
      'response',
    ]);

    if (maybeResponse) {
      transformedSchema.results.response = maybeResponse;
    }

    if (isZodObject(querystring)) {
      transformedSchema.results.querystring = createParams(
        querystring,
        'query',
        components,
        [url, 'querystring'],
      );
    }

    if (isZodObject(params)) {
      transformedSchema.results.params = createParams(
        params,
        'path',
        components,
        [url, 'params'],
      );
    }

    if (isZodObject(headers)) {
      transformedSchema.results.headers = createParams(
        headers,
        'header',
        components,
        [url, 'headers'],
      );
    }

    schema[FASTIFY_ZOD_OPENAPI_RESULTS] = transformedSchema;
  });
};

export const fastifyZodOpenApiPlugin = fp(fastifyZodOpenApi, {
  name: 'fastify-zod-openapi',
});

/**
 * FastifyPluginCallbackZodOpenApi with Zod automatic type inference
 *
 * @example
 * ```typescript
 * import { FastifyPluginCallbackZodOpenApi } from "fastify-zod-openapi"
 *
 * const plugin: FastifyPluginCallbackZodOpenApi = (fastify, options, done) => {
 *   done()
 * }
 * ```
 */
export type FastifyPluginCallbackZodOpenApi<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault,
> = FastifyPluginCallback<Options, Server, FastifyZodOpenApiTypeProvider>;

/**
 * FastifyPluginAsyncZodOpenApi with Zod automatic type inference
 *
 * @example
 * ```typescript
 * import { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi"
 *
 * const plugin: FastifyPluginAsyncZodOpenApi = async (fastify, options) => {
 * }
 * ```
 */
export type FastifyPluginAsyncZodOpenApi<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault,
> = FastifyPluginAsync<Options, Server, FastifyZodOpenApiTypeProvider>;
