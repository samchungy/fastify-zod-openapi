import UnderPressure from '@fastify/under-pressure';
import fastify from 'fastify';
import * as z from 'zod/v4';
import type { ZodOpenApiResponsesObject } from 'zod-openapi';

import type { FastifyZodOpenApiTypeProvider } from './plugin';
import {
  createSerializerCompiler,
  serializerCompiler,
} from './serializerCompiler';
import { ResponseSerializationError } from './validationError';

describe('serializerCompiler', () => {
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
                    jobId: z.string().meta({
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
              jobId: z.string().meta({
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

  it('should handle a route with a JSON schema', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);
    app.post(
      '/',
      {
        schema: {
          response: {
            200: {
              type: 'object',
              properties: {
                jobId: { type: 'string' },
              },
            },
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

  it('should work with under pressure', async () => {
    const app = fastify();

    app.register(UnderPressure, {
      exposeStatusRoute: '/status/health-check',
      healthCheck: () => Promise.resolve(true),
    });
    app.setSerializerCompiler(serializerCompiler);
    app.post(
      '/',
      {
        schema: {
          response: {
            200: {
              type: 'object',
              properties: {
                jobId: { type: 'string' },
              },
            },
          },
        },
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );

    await app.ready();

    const result = await app.inject().get('/status/health-check');

    expect(result.json()).toEqual({ status: 'ok' });
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
                    jobId: z.string().meta({
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
              jobId: z.string().default('foo').meta({
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

  it('should handle a complex response', async () => {
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
                    // invent a complex schema
                    jobId: z.string().meta({
                      description: 'Job ID',
                      example: '60002023',
                    }),
                    jobName: z.string().meta({
                      description: 'Job Name',
                      example: 'Job 1',
                    }),
                    jobStatus: z.string().meta({
                      description: 'Job Status',
                      example: 'completed',
                    }),
                    jobDetails: z.object({
                      jobType: z.string().meta({
                        description: 'Job Type',
                        example: 'export',
                      }),
                      jobDate: z.string().meta({
                        description: 'Job Date',
                        example: '2021-09-01',
                      }),
                    }),
                    jobArray: z.array(
                      z
                        .object({
                          jobType: z.string().meta({
                            description: 'Job Type',
                            example: 'export',
                          }),
                          jobDate: z.string().meta({
                            description: 'Job Date',
                            example: '2021-09-01',
                          }),
                        })
                        .meta({ ref: 'something' }),
                    ),
                    jobTuple: z
                      .tuple([
                        z.string().meta({ ref: 'string' }),
                        z.number().meta({ ref: 'number' }),
                      ])
                      .meta({
                        description: 'Job Tuple',
                        example: ['foo', 123],
                      }),
                    metadata: z.discriminatedUnion('type', [
                      z
                        .object({
                          type: z.literal('success'),
                          success: z.string().meta({
                            description: 'Success Message',
                            example: 'Job completed successfully',
                          }),
                        })
                        .meta({ ref: 'success' }),
                      z
                        .object({
                          type: z.literal('error'),
                          error: z.string().meta({
                            description: 'Error Message',
                            example: 'Job failed',
                          }),
                        })
                        .meta({ ref: 'error' }),
                    ]),
                  }),
                },
              },
            },
          } satisfies ZodOpenApiResponsesObject,
        },
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
          jobName: 'Job 1',
          jobStatus: 'completed',
          jobDetails: {
            jobType: 'export',
            jobDate: '2021-09-01',
          },
          jobArray: [
            {
              jobType: 'export',
              jobDate: '2021-09-01',
            },
          ],
          jobTuple: ['foo', 123],
          metadata: {
            type: 'success',
            success: 'Job completed successfully',
          },
        }),
    );
    await app.ready();

    const result = await app.inject().post('/');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "jobArray": [
    {
      "jobDate": "2021-09-01",
      "jobType": "export",
    },
  ],
  "jobDetails": {
    "jobDate": "2021-09-01",
    "jobType": "export",
  },
  "jobId": "60002023",
  "jobName": "Job 1",
  "jobStatus": "completed",
  "jobTuple": [
    "foo",
    123,
  ],
  "metadata": {
    "success": "Job completed successfully",
    "type": "success",
  },
}
`);
  });
});

describe('createSerializerCompiler', () => {
  it('should create a custom serializer', async () => {
    const app = fastify();

    const customSerializerCompiler = createSerializerCompiler({
      stringify: JSON.stringify,
    });
    app.setSerializerCompiler(customSerializerCompiler);

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: z.object({
              jobId: z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
          },
        },
      },
      async (_req, res) => res.send({ jobId: '123' }),
    );
    await app.ready();

    const result = await app.inject().post('/');

    expect(result.json()).toEqual({ jobId: '123' });
  });

  it('should support custom components', async () => {
    const app = fastify();

    const jobId = z.string().meta({
      description: 'Job ID',
      example: '60002023',
    });
    const customSerializerCompiler = createSerializerCompiler({
      components: {
        jobId,
      },
    });
    app.setSerializerCompiler(customSerializerCompiler);

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: z.object({
              jobId,
            }),
          },
        },
      },
      async (_req, res) => res.send({ jobId: '123' }),
    );
    await app.ready();

    const result = await app.inject().post('/');

    expect(result.json()).toEqual({ jobId: '123' });
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
              jobId: z.string().meta({
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
