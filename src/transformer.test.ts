import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import * as z from 'zod/v4';

import {
  type FastifyZodOpenApiTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from '../src';
import { fastifyZodOpenApiPlugin } from '../src/plugin';
import {
  type FastifyZodOpenApiSchema,
  fastifyZodOpenApiTransformers,
} from '../src/transformer';

describe('fastifyZodOpenApiTransform', () => {
  it('should support creating an openapi response', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);
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
      ...fastifyZodOpenApiTransformers,
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
                    jobId: z.string().meta({
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
  "components": {},
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
                  "additionalProperties": false,
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

  it('should support creating a registered openapi response', async () => {
    const app = fastify();

    app.setSerializerCompiler(serializerCompiler);
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
      ...fastifyZodOpenApiTransformers,
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
              id: 'JobResponse',
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
    "responses": {
      "JobResponse": {
        "content": {
          "application/json": {
            "schema": {
              "additionalProperties": false,
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
                  "$ref": "#/components/responses/JobResponse",
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
      ...fastifyZodOpenApiTransformers,
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
              jobId: z.string().meta({
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
        "components": {},
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
                        "additionalProperties": false,
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          body: z.object({
            jobId: z.string().meta({
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
        "components": {},
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

  it('should support creating a full openapi body', async () => {
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          body: {
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
        } satisfies FastifyZodOpenApiSchema,
      },
      async (req, res) => {
        res.send({
          jobId: req.body.jobId,
        });
      },
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
      {
        "components": {},
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

  it('should support creating a registered request body', async () => {
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          body: {
            id: 'JobRequest',
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
        } satisfies FastifyZodOpenApiSchema,
      },
      async (req, res) => {
        res.send({
          jobId: req.body.jobId,
        });
      },
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "components": {
    "requestBodies": {
      "JobRequest": {
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
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/requestBodies/JobRequest",
              },
            },
          },
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

  it('should support creating an openapi union body', async () => {
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          body: z.union([
            z.object({
              jobId: z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
            z.object({
              jobId: z.number().meta({
                description: 'Job ID',
                example: 60002023,
              }),
            }),
          ]),
        },
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
  "components": {},
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
                "anyOf": [
                  {
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
                  {
                    "properties": {
                      "jobId": {
                        "description": "Job ID",
                        "example": 60002023,
                        "type": "number",
                      },
                    },
                    "required": [
                      "jobId",
                    ],
                    "type": "object",
                  },
                ],
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

  it('should support creating an openapi array body', async () => {
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          body: z.array(
            z.string().meta({
              description: 'Job ID',
              example: '60002023',
            }),
          ),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => res.send(['60002023']),
    );
    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
{
  "components": {},
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
                "items": {
                  "description": "Job ID",
                  "example": "60002023",
                  "type": "string",
                },
                "type": "array",
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          params: z.object({
            jobId: z.string().meta({
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
        "components": {},
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
                    "description": "Job ID",
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          querystring: z.object({
            jobId: z.string().meta({
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
        "components": {},
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
                    "description": "Job ID",
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

  it('should support creating parameters using Zod Effects', async () => {
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          body: z
            .object({
              jobId: z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            })
            .refine(() => true),
          querystring: z
            .object({
              jobId: z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            })
            .refine(() => true),
          params: z
            .object({
              jobId: z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            })
            .refine(() => true),
          headers: z
            .object({
              jobId: z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            })
            .refine(() => true),
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
  "components": {},
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
              "description": "Job ID",
              "example": "60002023",
              "type": "string",
            },
          },
          {
            "description": "Job ID",
            "in": "path",
            "name": "jobId",
            "required": true,
            "schema": {
              "description": "Job ID",
              "example": "60002023",
              "type": "string",
            },
          },
          {
            "description": "Job ID",
            "in": "header",
            "name": "jobId",
            "required": true,
            "schema": {
              "description": "Job ID",
              "example": "60002023",
              "type": "string",
            },
          },
        ],
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
      ...fastifyZodOpenApiTransformers,
    });
    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
      '/',
      {
        schema: {
          headers: z.object({
            jobId: z.string().meta({
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
        "components": {},
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
                    "description": "Job ID",
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
  it('should support creating components using the id key', async () => {
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
      ...fastifyZodOpenApiTransformers,
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
                    jobId: z.string().meta({
                      description: 'Job ID',
                      example: '60002023',
                      id: 'jobId',
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
                  "additionalProperties": false,
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

    const jobId = z.string().meta({
      description: 'Job ID',
      example: '60002023',
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
      ...fastifyZodOpenApiTransformers,
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
                  "additionalProperties": false,
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

    const jobId = z.string().nullable().meta({
      description: 'Job ID',
      example: '60002023',
      id: 'customOpenApiJobId',
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
      ...fastifyZodOpenApiTransformers,
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
      "customOpenApiJobId": {
        "anyOf": [
          {
            "type": "string",
          },
          {
            "type": "null",
          },
        ],
        "description": "Job ID",
        "example": "60002023",
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
                  "additionalProperties": false,
                  "properties": {
                    "jobId": {
                      "$ref": "#/components/schemas/customOpenApiJobId",
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
        override: (ctx) => {
          if (ctx.jsonSchema.anyOf) {
            ctx.jsonSchema.oneOf = ctx.jsonSchema.anyOf;
            delete ctx.jsonSchema.anyOf;
          }
        },
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
      ...fastifyZodOpenApiTransformers,
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
  "components": {},
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
});
