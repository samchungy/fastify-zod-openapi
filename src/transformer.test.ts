import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import * as z from 'zod/v4';

import {
  type FastifyZodOpenApiTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from '../src/index.js';
import { fastifyZodOpenApiPlugin } from '../src/plugin.js';
import {
  type FastifyZodOpenApiSchema,
  fastifyZodOpenApiTransformers,
} from '../src/transformer.js';

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
                  "$ref": "#/components/responses/JobResponse",
                },
              },
            },
          },
        },
      }
    `);
  });

  it('should support creating a registered openapi response with multiple content types', async () => {
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
                'plain/text': {
                  schema: z.string().meta({ description: 'Job ID' }),
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
                "plain/text": {
                  "schema": {
                    "description": "Job ID",
                    "type": "string",
                  },
                },
              },
            },
          },
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
                  "$ref": "#/components/responses/JobResponse",
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

  it('should support creating a shortcut openapi response with produces', async () => {
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
          produces: ['multipart/form-data'],
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
                    "multipart/form-data": {
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

  it('should support creating a full openapi text body', async () => {
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
              'plain/text': {
                schema: z.string(),
              },
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (req, res) => {
        res.send({
          jobId: req.body,
        });
      },
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
                  "plain/text": {
                    "schema": {
                      "type": "string",
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

  it('should support the consumes argument', async () => {
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
          consumes: ['multipart/form-data'],
          body: z.string(),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (req, res) => {
        res.send({
          jobId: req.body,
        });
      },
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
                  "multipart/form-data": {
                    "schema": {
                      "type": "string",
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
                "$ref": "#/components/requestBodies/JobRequest",
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
      '/:jobId',
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
        "components": {
          "schemas": {},
        },
        "info": {
          "title": "hello world",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/{jobId}": {
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

  it('should support multiple methods', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
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

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
      method: ['PUT', 'POST'],
      url: '/',
      handler: async (_req, res) =>
        res.send({
          jobId: '60002023',
        }),
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
    });
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
            "put": {
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
        "components": {
          "schemas": {},
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

  it('should support creating a components with a body', async () => {
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
          body: z.object({}).meta({ id: 'test' }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => {
        res.send({
          jobId: '60002023',
        });
      },
    );

    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
      {
        "components": {
          "schemas": {
            "test": {
              "properties": {},
              "type": "object",
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
                      "$ref": "#/components/schemas/test",
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

  it('should extract examples from components with a body', async () => {
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
              id: z.number(),
              text: z.string(),
              isActive: z.boolean().optional(),
            })
            .meta({
              examples: [
                { id: 1, text: 'yolo', isActive: true },
                { id: 2, text: 'bro', isActive: false },
                { id: 3, text: 'cool' },
              ],
            }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => {
        res.send({
          jobId: '60002023',
        });
      },
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
                    "examples": {
                      "Example1": {
                        "value": {
                          "id": 1,
                          "isActive": true,
                          "text": "yolo",
                        },
                      },
                      "Example2": {
                        "value": {
                          "id": 2,
                          "isActive": false,
                          "text": "bro",
                        },
                      },
                      "Example3": {
                        "value": {
                          "id": 3,
                          "text": "cool",
                        },
                      },
                    },
                    "schema": {
                      "properties": {
                        "id": {
                          "type": "number",
                        },
                        "isActive": {
                          "type": "boolean",
                        },
                        "text": {
                          "type": "string",
                        },
                      },
                      "required": [
                        "id",
                        "text",
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

  it('should not extract examples if provided an empty examples array', async () => {
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
              id: z.number(),
              text: z.string(),
              isActive: z.boolean().optional(),
            })
            .meta({
              examples: [],
            }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => {
        res.send({
          jobId: '60002023',
        });
      },
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
                        "id": {
                          "type": "number",
                        },
                        "isActive": {
                          "type": "boolean",
                        },
                        "text": {
                          "type": "string",
                        },
                      },
                      "required": [
                        "id",
                        "text",
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

  it('should not extract examples if no examples are provided', async () => {
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
              id: z.number(),
              text: z.string(),
              isActive: z.boolean().optional(),
            })
            .meta({}),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => {
        res.send({
          jobId: '60002023',
        });
      },
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
                        "id": {
                          "type": "number",
                        },
                        "isActive": {
                          "type": "boolean",
                        },
                        "text": {
                          "type": "string",
                        },
                      },
                      "required": [
                        "id",
                        "text",
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

  it('should preserve existing components', async () => {
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
        components: {
          schemas: {
            foo: {
              type: 'string',
            },
          },
          securitySchemes: {
            bar: {
              type: 'http',
              scheme: 'bearer',
            },
          },
        },
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
              foo: z.string(),
            })
            .meta({ id: 'test-preserve' }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => res.send({ foo: 'bar' }),
    );

    await app.ready();

    const result = await app.inject().get('/documentation/json');

    expect(result.json()).toMatchInlineSnapshot(`
      {
        "error": "Internal Server Error",
        "message": "Cannot read properties of undefined (reading 'description')",
        "statusCode": 500,
      }
    `);
  });

  it('should support hidden routes', async () => {
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
          tags: ['X-HIDDEN'],
          body: z.object({
            foo: z.string(),
          }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => res.send({ foo: 'bar' }),
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
        "openapi": "3.0.3",
        "paths": {},
      }
    `);
  });

  it('should support 3.x', async () => {
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
            foo: z.string().nullable(),
          }),
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => res.send({ foo: 'bar' }),
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
        "openapi": "3.0.3",
        "paths": {
          "/": {
            "post": {
              "requestBody": {
                "content": {
                  "application/json": {
                    "schema": {
                      "properties": {
                        "foo": {
                          "nullable": true,
                          "type": "string",
                        },
                      },
                      "required": [
                        "foo",
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

  it('should support empty responses with no content field', async () => {
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

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().delete(
      '/{id}',
      {
        schema: {
          params: z.object({
            id: z.string(),
          }),
          response: {
            '204': {
              description: 'The resource was deleted successfully.',
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (_req, res) => res.status(204).send(),
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
          "/{id}": {
            "delete": {
              "parameters": [
                {
                  "in": "path",
                  "name": "id",
                  "required": true,
                  "schema": {
                    "type": "string",
                  },
                },
              ],
              "responses": {
                "204": {
                  "description": "The resource was deleted successfully.",
                },
              },
            },
          },
        },
      }
    `);
  });
});
