import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifyTypeProvider,
  RawServerBase,
  RawServerDefault,
} from 'fastify';
import fp from 'fastify-plugin';
import type * as z from 'zod/v4';
import type { ZodType } from 'zod/v4';
import type {
  CreateDocumentOptions,
  ZodOpenApiComponentsObject,
  ZodOpenApiRequestBodyObject,
  oas31,
} from 'zod-openapi';
import { type ComponentRegistry, createRegistry } from 'zod-openapi/api';

import type { RequestValidationError } from './validationError';

export const FASTIFY_ZOD_OPENAPI_CONFIG = Symbol('fastify-zod-openapi-config');

export interface FastifyZodOpenApiOpts {
  components?: ZodOpenApiComponentsObject;
  documentOpts?: CreateDocumentOptions;
}

interface FastifyZodOpenApiConfig {
  registry: ComponentRegistry;
  documentOpts?: CreateDocumentOptions;
  fastifyComponents: {
    responses: Map<
      string,
      {
        referenceObject: oas31.ReferenceObject;
        path: string[];
      }
    >;
    requestBodies: Map<
      string,
      {
        referenceObject: oas31.ReferenceObject;
        path: string[];
      }
    >;
  };
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
      [FASTIFY_ZOD_OPENAPI_CONFIG]?: FastifyZodOpenApiConfig;
    }
  }
}

export interface FastifyZodOpenApiTypeProvider extends FastifyTypeProvider {
  validator: this['schema'] extends ZodType
    ? z.infer<this['schema']>
    : this['schema'] extends ZodOpenApiRequestBodyObject
      ? this['schema']['content'] extends Record<string, { schema: ZodType }>
        ? z.infer<
            this['schema']['content'][keyof this['schema']['content']]['schema']
          >
        : unknown
      : unknown;
  serializer: this['schema'] extends ZodType
    ? z.input<this['schema']>
    : unknown;
}

export type FastifyZodOpenApi = FastifyPluginAsync<FastifyZodOpenApiOpts>;

// eslint-disable-next-line @typescript-eslint/require-await
const fastifyZodOpenApi: FastifyZodOpenApi = async (fastify, opts) => {
  const registry = createRegistry(opts.components);

  fastify.addHook('onRoute', ({ schema }) => {
    if (!schema || schema.hide) {
      return;
    }

    schema[FASTIFY_ZOD_OPENAPI_CONFIG] ??= {
      registry,
      documentOpts: opts.documentOpts,
      fastifyComponents: {
        responses: new Map(),
        requestBodies: new Map(),
      },
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
