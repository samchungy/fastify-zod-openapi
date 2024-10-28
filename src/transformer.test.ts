import 'zod-openapi/extend';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import { z } from 'zod';

import {
  type FastifyZodOpenApiTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from '../src';
import { fastifyZodOpenApiPlugin } from '../src/plugin';
import {
  type FastifyZodOpenApiSchema,
  fastifyZodOpenApiTransform,
  fastifyZodOpenApiTransformObject,
} from '../src/transformer';

describe('fastifyZodOpenApiTransform', () => {
  it('should support creating an openapi response', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifyZodOpenApiPlugin);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.1.0',
      },
      transform: fastifyZodOpenApiTransform,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

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
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "components": {
    "schemas": {},
  },
  "info": {
    "title": "hello world",
    "version": "1.0.0",
  },
  "openapi": "3.1.0",
  "paths": {
    "/": {
      "post": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "jobId": {
                      "description": "Job ID",
                      "example": "60002023",
                      "type": "string",
                    },
                  },
                  "required": [
                    "jobId",
                  ],
                  "type": "object",
                },
              },
            },
            "description": "Default Response",
          },
        },
      },
    },
  },
}
`);
  });

  it('should support creating a shortcut openapi response', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifyZodOpenApiPlugin);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.1.0',
      },
      transform: fastifyZodOpenApiTransform,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
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
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
      {
        "components": {
          "schemas": {},
        },
        "info": {
          "title": "hello world",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/": {
            "post": {
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "properties": {
                          "jobId": {
                            "description": "Job ID",
                            "example": "60002023",
                            "type": "string",
                          },
                        },
                        "required": [
                          "jobId",
                        ],
                        "type": "object",
                      },
                    },
                  },
                  "description": "Default Response",
                },
              },
            },
          },
        },
      }
    `);
  });

  it('should support creating an openapi body', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);

    await app.register(fastifyZodOpenApiPlugin);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.1.0',
      },
      transform: fastifyZodOpenApiTransform,
    });
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
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
      {
        "components": {
          "schemas": {},
        },
        "info": {
          "title": "hello world",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/": {
            "post": {
              "requestBody": {
                "content": {
                  "application/json": {
                    "schema": {
                      "properties": {
                        "jobId": {
                          "description": "Job ID",
                          "example": "60002023",
                          "type": "string",
                        },
                      },
                      "required": [
                        "jobId",
                      ],
                      "type": "object",
                    },
                  },
                },
                "required": true,
              },
              "responses": {
                "200": {
                  "description": "Default Response",
                },
              },
            },
          },
        },
      }
    `);
  });

  it('should support creating an openapi path parameter', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);

    await app.register(fastifyZodOpenApiPlugin);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.1.0',
      },
      transform: fastifyZodOpenApiTransform,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          params: z.object({
            jobId: z.string().openapi({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
      {
        "components": {
          "schemas": {},
        },
        "info": {
          "title": "hello world",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/": {
            "post": {
              "parameters": [
                {
                  "description": "Job ID",
                  "in": "path",
                  "name": "jobId",
                  "required": true,
                  "schema": {
                    "example": "60002023",
                    "type": "string",
                  },
                },
              ],
              "responses": {
                "200": {
                  "description": "Default Response",
                },
              },
            },
          },
        },
      }
    `);
  });

  it('should support creating an openapi query parameter', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);

    await app.register(fastifyZodOpenApiPlugin);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.1.0',
      },
      transform: fastifyZodOpenApiTransform,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          querystring: z.object({
            jobId: z.string().openapi({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
      {
        "components": {
          "schemas": {},
        },
        "info": {
          "title": "hello world",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/": {
            "post": {
              "parameters": [
                {
                  "description": "Job ID",
                  "in": "query",
                  "name": "jobId",
                  "required": true,
                  "schema": {
                    "example": "60002023",
                    "type": "string",
                  },
                },
              ],
              "responses": {
                "200": {
                  "description": "Default Response",
                },
              },
            },
          },
        },
      }
    `);
  });

  it('should support creating an openapi header parameter', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);

    await app.register(fastifyZodOpenApiPlugin);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.1.0',
      },
      transform: fastifyZodOpenApiTransform,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          headers: z.object({
            jobId: z.string().openapi({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
      {
        "components": {
          "schemas": {},
        },
        "info": {
          "title": "hello world",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/": {
            "post": {
              "parameters": [
                {
                  "description": "Job ID",
                  "in": "header",
                  "name": "jobId",
                  "required": true,
                  "schema": {
                    "example": "60002023",
                    "type": "string",
                  },
                },
              ],
              "responses": {
                "200": {
                  "description": "Default Response",
                },
              },
            },
          },
        },
      }
    `);
  });
});

describe('fastifyZodOpenApiTransformObject', () => {
  it('should support creating components using ref key', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifyZodOpenApiPlugin);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.1.0',
      },
      transform: fastifyZodOpenApiTransform,
      transformObject: fastifyZodOpenApiTransformObject,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

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
                      ref: 'jobId',
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

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "components": {
    "schemas": {
      "jobId": {
        "description": "Job ID",
        "example": "60002023",
        "type": "string",
      },
    },
  },
  "info": {
    "title": "hello world",
    "version": "1.0.0",
  },
  "openapi": "3.1.0",
  "paths": {
    "/": {
      "post": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "jobId": {
                      "$ref": "#/components/schemas/jobId",
                    },
                  },
                  "required": [
                    "jobId",
                  ],
                  "type": "object",
                },
              },
            },
            "description": "Default Response",
          },
        },
      },
    },
  },
}
`);
  });

  it('should support creating components using components option', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);

    const jobId = z.string().openapi({
      description: 'Job ID',
      example: '60002023',
      ref: 'jobId',
    });

    await app.register(fastifyZodOpenApiPlugin, {
      components: { schemas: { jobId } },
    });
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.1.0',
      },
      transform: fastifyZodOpenApiTransform,
      transformObject: fastifyZodOpenApiTransformObject,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: {
              content: {
                'application/json': {
                  schema: z.object({
                    jobId,
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

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "components": {
    "schemas": {
      "jobId": {
        "description": "Job ID",
        "example": "60002023",
        "type": "string",
      },
    },
  },
  "info": {
    "title": "hello world",
    "version": "1.0.0",
  },
  "openapi": "3.1.0",
  "paths": {
    "/": {
      "post": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "jobId": {
                      "$ref": "#/components/schemas/jobId",
                    },
                  },
                  "required": [
                    "jobId",
                  ],
                  "type": "object",
                },
              },
            },
            "description": "Default Response",
          },
        },
      },
    },
  },
}
`);
  });

  it('should support setting a custom openapi version', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);

    const jobId = z.string().nullable().openapi({
      description: 'Job ID',
      example: '60002023',
      ref: 'jobId',
    });

    await app.register(fastifyZodOpenApiPlugin, {
      components: { schemas: { jobId } },
    });
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.0.3',
      },
      transform: fastifyZodOpenApiTransform,
      transformObject: fastifyZodOpenApiTransformObject,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: {
              content: {
                'application/json': {
                  schema: z.object({
                    jobId,
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

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "components": {
    "schemas": {
      "jobId": {
        "description": "Job ID",
        "example": "60002023",
        "nullable": true,
        "type": "string",
      },
    },
  },
  "info": {
    "title": "hello world",
    "version": "1.0.0",
  },
  "openapi": "3.0.3",
  "paths": {
    "/": {
      "post": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "jobId": {
                      "$ref": "#/components/schemas/jobId",
                    },
                  },
                  "required": [
                    "jobId",
                  ],
                  "type": "object",
                },
              },
            },
            "description": "Default Response",
          },
        },
      },
    },
  },
}
`);
  });

  it('should support create document options', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifyZodOpenApiPlugin, {
      documentOpts: {
        unionOneOf: true,
      },
    });
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.0.3',
      },
      transform: fastifyZodOpenApiTransform,
      transformObject: fastifyZodOpenApiTransformObject,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: {
              content: {
                'application/json': {
                  schema: z.union([z.string(), z.number()]),
                },
              },
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => res.send('foo'),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "info": {
    "title": "hello world",
    "version": "1.0.0",
  },
  "openapi": "3.0.3",
  "paths": {
    "/": {
      "post": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "oneOf": [
                    {
                      "type": "string",
                    },
                    {
                      "type": "number",
                    },
                  ],
                },
              },
            },
            "description": "Default Response",
          },
        },
      },
    },
  },
}
`);
  });

  it('should support required fields for objects that use custom unions', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifyZodOpenApiPlugin, {
      documentOpts: {
        unionOneOf: true,
      },
    });
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'hello world',
          version: '1.0.0',
        },
        openapi: '3.0.3',
      },
      transform: fastifyZodOpenApiTransform,
      transformObject: fastifyZodOpenApiTransformObject,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    const zodDate = z
      .union([
        z.custom<Date>((val) => val instanceof Date),
        z.string().transform((str: string, ctx: z.RefinementCtx): Date => {
          try {
            return new Date(str);
          } catch (_e) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Unable to parse ${str} as a Date`,
            });
            return z.NEVER;
          }
        }),
      ])
      .openapi({
        type: 'string',
        format: 'date',
        description: 'Awesome!',
        example: new Date('2023-10-01'),
      });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          response: {
            200: {
              content: {
                'application/json': {
                  schema: z
                    .object({ date: zodDate, name: z.string().min(5) })
                    .strict(),
                },
              },
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) =>
        res.send({
          date: new Date('2023-10-01'),
          name: 'John Doe',
        }),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "info": {
    "title": "hello world",
    "version": "1.0.0",
  },
  "openapi": "3.0.3",
  "paths": {
    "/": {
      "post": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "additionalProperties": false,
                  "properties": {
                    "date": {
                      "description": "Awesome!",
                      "example": {},
                      "format": "date",
                      "type": "string",
                    },
                    "name": {
                      "minLength": 5,
                      "type": "string",
                    },
                  },
                  "required": [
                    "name",
                    "date",
                  ],
                  "type": "object",
                },
              },
            },
            "description": "Default Response",
          },
        },
      },
    },
  },
}
`);
  });
});
