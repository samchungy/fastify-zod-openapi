import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import { z } from 'zod';
import { extendZodWithOpenApi } from 'zod-openapi';

import {
  type FastifyZodOpenApiTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from '../src';
import { fastifyZodOpenApiPlugin } from '../src/plugin';
import {
  type FastifyZodOpenApiSchema,
  fastifyZodOpenApiTransform,
} from '../src/transformer';

extendZodWithOpenApi(z);

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
