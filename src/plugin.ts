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
  ZodOpenApiComponentsObject,
  ZodOpenApiVersion,
} from 'zod-openapi';
import {
  type ComponentsObject as ApiComponentsObject,
  getDefaultComponents,
} from 'zod-openapi/api';

export const FASTIFY_ZOD_OPENAPI_COMPONENTS = Symbol(
  'fastify-zod-openapi-components',
);

type FastifyZodOpenApiOpts = {
  openapi?: ZodOpenApiVersion;
  components?: ZodOpenApiComponentsObject;
};

declare module 'fastify' {
  interface FastifySchema {
    [FASTIFY_ZOD_OPENAPI_COMPONENTS]?: ApiComponentsObject;
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
  const components = getDefaultComponents(opts.components, opts.openapi);

  fastify.addHook('onRoute', (routeOptions) => {
    if (routeOptions.schema) {
      routeOptions.schema[FASTIFY_ZOD_OPENAPI_COMPONENTS] ??= components;
    }
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
