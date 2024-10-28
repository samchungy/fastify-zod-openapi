import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifyTypeProvider,
  RawServerBase,
  RawServerDefault,
} from 'fastify';
import fp from 'fastify-plugin';
import type { ZodType, z } from 'zod';
import type {
  CreateDocumentOptions,
  ZodOpenApiComponentsObject,
} from 'zod-openapi';
import {
  type ComponentsObject as ApiComponentsObject,
  getDefaultComponents,
} from 'zod-openapi/api';

import type { RequestValidationError } from './validationError';

type FastifyResponseSchema = ZodType | Record<string, unknown>;

type FastifySwaggerSchemaObject = Omit<oas31.SchemaObject, 'required'> & {
  required?: string[] | boolean;
};

export const FASTIFY_ZOD_OPENAPI_CONFIG = Symbol('fastify-zod-openapi-config');
export const FASTIFY_ZOD_OPENAPI_COMPONENTS = Symbol(
  'fastify-zod-openapi-components',
);

export interface FastifyZodOpenApiOpts {
  components?: ZodOpenApiComponentsObject;
  documentOpts?: CreateDocumentOptions;
}

interface FastifyZodOpenApiConfig {
  components: ApiComponentsObject;
  documentOpts?: CreateDocumentOptions;
}

declare module 'fastify' {
  interface FastifySchema {
    [FASTIFY_ZOD_OPENAPI_CONFIG]?: FastifyZodOpenApiConfig;
  }

  interface FastifyValidationResult {
    errors?: RequestValidationError[];
  }
}

declare module 'openapi-types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace OpenAPIV3 {
    interface Document {
      [FASTIFY_ZOD_OPENAPI_COMPONENTS]?: ApiComponentsObject;
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

// eslint-disable-next-line @typescript-eslint/require-await
const fastifyZodOpenApi: FastifyZodOpenApi = async (fastify, opts) => {
  const components = getDefaultComponents(opts.components);

  fastify.addHook('onRoute', ({ schema }) => {
    if (!schema || schema.hide) {
      return;
    }

    schema[FASTIFY_ZOD_OPENAPI_CONFIG] ??= {
      components,
      documentOpts: opts.documentOpts,
    };
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
