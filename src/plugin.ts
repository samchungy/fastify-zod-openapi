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
import { api } from 'zod-openapi';
import type {
  ZodOpenApiComponentsObject,
  ZodOpenApiVersion,
} from 'zod-openapi';

export const FASTIFY_ZOD_OPENAPI_COMPONENTS = Symbol(
  'fastify-zod-openapi-components',
);

type FastifyZodOpenApiOpts = {
  openapi?: ZodOpenApiVersion;
  components?: ZodOpenApiComponentsObject;
};

declare module 'fastify' {
  interface FastifySchema {
    [FASTIFY_ZOD_OPENAPI_COMPONENTS]?: api.ComponentsObject;
  }
}

declare module 'openapi-types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace OpenAPIV3 {
    interface Document {
      [FASTIFY_ZOD_OPENAPI_COMPONENTS]?: api.ComponentsObject;
    }
  }
}

export interface FastifyZodOpenApiTypeProvider extends FastifyTypeProvider {
  output: this['input'] extends ZodType ? z.infer<this['input']> : never;
}

export type FastifyZodOpenApi = FastifyPluginAsync<FastifyZodOpenApiOpts>;

// eslint-disable-next-line @typescript-eslint/require-await
const fastifyZodOpenApi: FastifyZodOpenApi = async (fastify, opts) => {
  const components = api.getDefaultComponents(opts.components, opts.openapi);

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
