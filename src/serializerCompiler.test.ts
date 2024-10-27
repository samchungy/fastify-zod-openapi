import 'zod-openapi/extend';
import fastify from 'fastify';
import { z } from 'zod';
import type { ZodOpenApiResponsesObject } from 'zod-openapi';

import type { FastifyZodOpenApiTypeProvider } from './plugin';
import { serializerCompiler } from './serializerCompiler';
import { ResponseSerializationError } from './validationError';

describe('validatorCompiler', () => {
  it('should pass a valid response', async () => {
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
          } satisfies ZodOpenApiResponsesObject,
        },
      },
      async (_req, res) => res.send({ jobId: '60002023' }),
    );
    await app.ready();

    const result = await app.inject().post('/');

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
          } satisfies ZodOpenApiResponsesObject,
        },
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

  it('should handle Zod effects in the response', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: z.object({
              jobId: z.string().default('foo').openapi({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
          },
        },
      },
      async (_req, res) => res.send({ jobId: undefined }),
    );
    await app.ready();

    const result = await app.inject().post('/');

    expect(result.json()).toEqual({ jobId: 'foo' });
  });
});

describe('setErrorHandler', () => {
  it('should handle ResponseSerializationError errors', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);
    app.setErrorHandler((error, _req, res) => {
      if (error instanceof ResponseSerializationError) {
        return res.status(500).send({
          error: 'Bad response',
        });
      }
      return res.status(500).send({
        error: 'Unknown error',
      });
    });

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
        res.send({ a: 'bad' } as unknown as { jobId: string }),
    );
    await app.ready();

    const result = await app.inject().post('/');
    expect(result.statusCode).toBe(500);
    expect(result.json()).toEqual({ error: 'Bad response' });
  });
});
