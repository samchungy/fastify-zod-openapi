import fastify from 'fastify';
import { z } from 'zod/v4';

import type { FastifyZodOpenApiTypeProvider } from './plugin';
import { RequestValidationError } from './validationError';
import { validatorCompiler } from './validatorCompiler';

describe('validatorCompiler', () => {
  describe('querystring', () => {
    it('should pass a valid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        '/',
        {
          schema: {
            querystring: z.object({
              jobId: z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
          },
        },
        (req, res) => res.send(req.query),
      );
      await app.ready();

      const result = await app.inject().get('/').query({ jobId: '60002023' });

      expect(result.json()).toEqual({ jobId: '60002023' });
    });

    it('should fail an invalid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        '/',
        {
          schema: {
            querystring: z.object({
              jobId: z.coerce.number().meta({
                description: 'Job ID',
                example: 60002023,
              }),
            }),
          },
        },
        (req, res) => res.send(req.query),
      );
      await app.ready();

      const result = await app.inject().get('/').query({ jobId: 'a' });

      expect(result.statusCode).toBe(400);
      expect(result.json()).toMatchInlineSnapshot(`
        {
          "code": "FST_ERR_VALIDATION",
          "error": "Bad Request",
          "message": "querystring/jobId Invalid input: expected number, received NaN",
          "statusCode": 400,
        }
      `);
    });
  });

  describe('body', () => {
    it('should pass a valid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
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
          },
        },
        (req, res) => res.send(req.body),
      );
      await app.ready();

      const result = await app.inject().post('/').body({ jobId: '60002023' });

      expect(result.json()).toEqual({ jobId: '60002023' });
    });

    it('should fail an invalid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        '/',
        {
          schema: {
            body: z.object({
              jobId: z.coerce.number().meta({
                description: 'Job ID',
                example: 60002023,
              }),
            }),
          },
        },
        (req, res) => res.send(req.body),
      );
      await app.ready();

      const result = await app.inject().post('/').body({ jobId: 'a' });

      expect(result.statusCode).toBe(400);
      expect(result.json()).toMatchInlineSnapshot(`
        {
          "code": "FST_ERR_VALIDATION",
          "error": "Bad Request",
          "message": "body/jobId Invalid input: expected number, received NaN",
          "statusCode": 400,
        }
      `);
    });
  });

  describe('headers', () => {
    it('should pass a valid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        '/',
        {
          schema: {
            headers: z.object({
              'job-id': z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
          },
        },
        (req, res) => res.send(req.headers),
      );
      await app.ready();

      const result = await app
        .inject()
        .get('/')
        .headers({ 'job-id': '60002023' });

      expect(result.json()).toMatchObject({ 'job-id': '60002023' });
    });

    it('should fail an invalid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        '/',
        {
          schema: {
            headers: z.object({
              jobId: z.coerce.number().meta({
                description: 'Job ID',
                example: 60002023,
              }),
            }),
          },
        },
        (req, res) => res.send(req.headers),
      );
      await app.ready();

      const result = await app.inject().get('/').headers({ jobId: 'a' });

      expect(result.statusCode).toBe(400);
      expect(result.json()).toMatchInlineSnapshot(`
        {
          "code": "FST_ERR_VALIDATION",
          "error": "Bad Request",
          "message": "headers/jobId Invalid input: expected number, received NaN",
          "statusCode": 400,
        }
      `);
    });
  });

  describe('params', () => {
    it('should pass a valid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        '/:jobId',
        {
          schema: {
            params: z.object({
              jobId: z.string().meta({
                description: 'Job ID',
                example: '60002023',
              }),
            }),
          },
        },
        (req, res) => res.send(req.params),
      );
      await app.ready();

      const result = await app.inject().get('/60002023');

      expect(result.json()).toEqual({ jobId: '60002023' });
    });

    it('should fail an invalid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        '/:jobId',
        {
          schema: {
            params: z.object({
              jobId: z.coerce.number().meta({
                description: 'Job ID',
                example: 60002023,
              }),
            }),
          },
        },
        (req, res) => res.send(req.headers),
      );
      await app.ready();

      const result = await app.inject().get('/a');

      expect(result.statusCode).toBe(400);
      expect(result.json()).toMatchInlineSnapshot(`
        {
          "code": "FST_ERR_VALIDATION",
          "error": "Bad Request",
          "message": "params/jobId Invalid input: expected number, received NaN",
          "statusCode": 400,
        }
      `);
    });
  });
});

describe('attachValidation', () => {
  it('should support handling validationError in requests', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
      '/',
      {
        schema: {
          querystring: z.object({
            jobId: z.string().meta({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
        },
        attachValidation: true,
      },
      (req, res) => {
        if (req.validationError) {
          for (const error of req.validationError.validation) {
            if (error instanceof RequestValidationError) {
              return res.status(400).send({
                custom: 'message',
                instancePath: error.instancePath,
                validationContext: req.validationError.validationContext,
              });
            }
          }
        }

        return res.send(req.query);
      },
    );

    await app.ready();

    const result = await app.inject().get('/').query({ foo: 'foo' });

    expect(result.json()).toEqual({
      custom: 'message',
      instancePath: '/jobId',
      validationContext: 'querystring',
    });
  });
});

describe('setSchemaErrorFormatter', () => {
  it('should support setting a setSchemaErrorFormatter', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
      '/',
      {
        schema: {
          querystring: z.object({
            jobId: z.string().meta({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
        },
      },
      (req, res) => res.send(req.query),
    );

    app.setSchemaErrorFormatter((errors, dataVar) => {
      let message = dataVar;
      for (const error of errors) {
        if (error instanceof RequestValidationError) {
          message += ` ${error.instancePath} ${error.keyword}`;
        }
      }

      return new Error(message);
    });

    await app.ready();

    const result = await app.inject().get('/').query({ foo: 'foo' });

    expect(result.json()).toEqual({
      code: 'FST_ERR_VALIDATION',
      error: 'Bad Request',
      message: 'querystring /jobId invalid_type',
      statusCode: 400,
    });
  });
});

describe('setErrorHandler', () => {
  it('should support setting a custom error handler', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
      '/',
      {
        schema: {
          querystring: z.object({
            jobId: z.string().meta({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
        },
      },
      (req, res) => res.send(req.query),
    );
    app.setErrorHandler((error, _req, res) => {
      if (error.validation) {
        for (const err of error.validation) {
          if (err instanceof RequestValidationError) {
            return res.status(400).send({
              custom: 'message',
              instancePath: err.instancePath,
              validationContext: error.validationContext,
            });
          }
        }
      }
      return res.status(500).send({
        message: 'Unhandled error',
      });
    });

    const result = await app.inject().get('/').query({ foo: 'foo' });

    expect(result.json()).toEqual({
      custom: 'message',
      instancePath: '/jobId',
      validationContext: 'querystring',
    });
  });

  it('should surface the original zod error and zod issue', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
      '/',
      {
        schema: {
          querystring: z.object({
            jobId: z.string().meta({
              description: 'Job ID',
              example: '60002023',
            }),
          }),
        },
      },
      (req, res) => res.send(req.query),
    );
    app.setErrorHandler((error, _req, res) => {
      if (error.validation) {
        for (const err of error.validation) {
          if (err instanceof RequestValidationError) {
            return res.status(400).send({
              zodIssue: err.params.issue,
              zodError: err.params.error,
            });
          }
        }
      }
      return res.status(500).send({
        message: 'Unhandled error',
      });
    });

    const result = await app.inject().get('/').query({ foo: 'foo' });

    expect(result.json()).toMatchInlineSnapshot(`
{
  "zodError": {
    "message": "[
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "jobId"
    ],
    "message": "Invalid input: expected string, received undefined"
  }
]",
    "name": "ZodError",
  },
  "zodIssue": {
    "code": "invalid_type",
    "expected": "string",
    "message": "Invalid input: expected string, received undefined",
    "path": [
      "jobId",
    ],
  },
}
`);
  });

  it('should map Zod Issues as RequestValidationError errors', async () => {
    const app = fastify();

    app.setValidatorCompiler(validatorCompiler);
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
      '/',
      {
        schema: {
          querystring: z.object({
            jobId: z.string().meta({
              description: 'Job ID',
              example: '60002023',
            }),
            jobTitle: z.string(),
          }),
        },
      },
      (req, res) => res.send(req.query),
    );
    app.setErrorHandler((error, _req, res) => {
      if (error.validation) {
        const errs = error.validation.map((err) => {
          if (err instanceof RequestValidationError) {
            return {
              zodIssue: err.params.issue,
            };
          }
          return err;
        });
        return res.status(400).send({
          errors: errs,
        });
      }
      return res.status(500).send({
        message: 'Unhandled error',
      });
    });

    const result = await app.inject().get('/').query({ foo: 'foo' });

    expect(result.json()).toMatchInlineSnapshot(`
{
  "errors": [
    {
      "zodIssue": {
        "code": "invalid_type",
        "expected": "string",
        "message": "Invalid input: expected string, received undefined",
        "path": [
          "jobId",
        ],
      },
    },
    {
      "zodIssue": {
        "code": "invalid_type",
        "expected": "string",
        "message": "Invalid input: expected string, received undefined",
        "path": [
          "jobTitle",
        ],
      },
    },
  ],
}
`);
  });
});
