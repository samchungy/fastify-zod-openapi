import type { FastifyPluginAsync, FastifyTypeProvider } from 'fastify';
import fp from 'fastify-plugin';
import type { ZodType, z } from 'zod';
import {
  type ComponentsObject,
  type ZodOpenApiComponentsObject,
  getDefaultComponents,
} from 'zod-openapi';

export const FASTIFY_ZOD_OPENAPI_COMPONENTS = Symbol(
  'fastify-zod-openapi-components',
);

type FastifyZodOpenApiOpts = {
  components: ZodOpenApiComponentsObject;
};

declare module 'fastify' {
  interface FastifySchema {
    [FASTIFY_ZOD_OPENAPI_COMPONENTS]?: ComponentsObject;
  }
}

export interface FastifyZodOpenApiTypeProvider extends FastifyTypeProvider {
  output: this['input'] extends ZodType ? z.infer<this['input']> : never;
}

export type FastifyZodOpenApi = FastifyPluginAsync<FastifyZodOpenApiOpts>;

// eslint-disable-next-line @typescript-eslint/require-await
const fastifyZodOpenApi: FastifyZodOpenApi = async (fastify, opts) => {
  const components = getDefaultComponents(opts.components, '3.0.3');

  fastify.addHook('onRoute', (routeOptions) => {
    if (routeOptions.schema) {
      routeOptions.schema[FASTIFY_ZOD_OPENAPI_COMPONENTS] ??= components;
    }
  });
};

export const fastifyZodOpenApiPlugin = fp(fastifyZodOpenApi, {
  name: 'fastify-zod-openapi',
});
