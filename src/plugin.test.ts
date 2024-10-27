import 'zod-openapi/extend';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import { z } from 'zod';

import type {
  FastifyPluginAsyncZodOpenApi,
  FastifyPluginCallbackZodOpenApi,
  FastifyZodOpenApiTypeProvider,
} from './plugin';
import { serializerCompiler } from './serializerCompiler';
import type { FastifyZodOpenApiSchema } from './transformer';
import { validatorCompiler } from './validatorCompiler';

describe('validatorCompiler', () => {
  it('should pass a valid response', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(fastifySwagger);
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          body: z.object({
            jobId: z.string().openapi({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
          response: {
            200: {
              content: {
                'application/json': {
                  schema: z.object({
                    jobId: z.string().openapi({
                      description: 'Job ID',
                      example: '60002023',
                    }),
                  }),
                },
              },
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );
    await app.ready();

    const result = await app.inject().post('/').body({ jobId: '60002023' });

    expect(result.json()).toEqual({ jobId: '60002023' });
  });

  it('should pass a short form response', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: z.object({
              jobId: z.string().openapi({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
          },
        },
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );
    await app.ready();

    const result = await app.inject().post('/');

    expect(result.json()).toEqual({ jobId: '60002023' });
  });

  it('should fail an invalid response', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: {
              content: {
                'application/json': {
                  schema: z.object({
                    jobId: z.string().openapi({
                      description: 'Job ID',
                      example: '60002023',
                    }),
                  }),
                },
              },
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => res.send({ jobId: 1 as unknown as string }),
    );
    await app.ready();

    const result = await app.inject().post('/');

    expect(result.statusCode).toBe(500);
    expect(result.json()).toMatchInlineSnapshot(`
      {
        "code": "FST_ERR_RESPONSE_SERIALIZATION",
        "error": "Internal Server Error",
        "message": "Response does not match the schema",
        "statusCode": 500,
      }
    `);
  });
});

describe('FastifyPluginAsyncZodOpenApi', () => {
  it('should work with an async plugin', async () => {
    const plugin: FastifyPluginAsyncZodOpenApi = async (
      fastifyInstance,
      _opts,
      // eslint-disable-next-line @typescript-eslint/require-await
    ) => {
      fastifyInstance.route({
        method: 'POST',
        url: '/',
        // Define your schema
        schema: {
          body: z.object({
            jobId: z.string().openapi({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
          response: {
            201: z.object({
              jobId: z.string().openapi({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
          },
        } satisfies FastifyZodOpenApiSchema,
        handler: async (req, res) => {
          await res.send({ jobId: req.body.jobId });
        },
      });
    };

    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(plugin);

    await app.ready();

    const result = await app.inject().post('/').body({ jobId: '60002023' });

    expect(result.json()).toEqual({ jobId: '60002023' });
  });

  it('should work with a callback plugin', async () => {
    const plugin: FastifyPluginCallbackZodOpenApi = (
      fastifyInstance,
      _opts,
      done,
    ) => {
      fastifyInstance.route({
        method: 'POST',
        url: '/',
        // Define your schema
        schema: {
          body: z.object({
            jobId: z.string().openapi({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
          response: {
            201: z.object({
              jobId: z.string().openapi({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
          },
        } satisfies FastifyZodOpenApiSchema,
        handler: async (req, res) => {
          await res.send({ jobId: req.body.jobId });
        },
      });
      done();
    };

    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(plugin);

    await app.ready();

    const result = await app.inject().post('/').body({ jobId: '60002023' });

    expect(result.json()).toEqual({ jobId: '60002023' });
  });
});
