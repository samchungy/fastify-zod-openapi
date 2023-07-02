import fastify from 'fastify';
import { z } from 'zod';
import { extendZodWithOpenApi } from 'zod-openapi';

import type { ZodOpenApiTypeProvider } from './plugin';
import { validatorCompiler } from './validatorCompiler';

extendZodWithOpenApi(z);

describe('validatorCompiler', () => {
  describe('querystring', () => {
    it('should pass a valid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<ZodOpenApiTypeProvider>().get(
        '/',
        {
          schema: {
            querystring: z.object({
              jobId: z.string().openapi({
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
      app.withTypeProvider<ZodOpenApiTypeProvider>().get(
        '/',
        {
          schema: {
            querystring: z.object({
              jobId: z.coerce.number().openapi({
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
          "message": "{
          "querystring": [
            {
              "code": "invalid_type",
              "expected": "number",
              "received": "nan",
              "path": [
                "jobId"
              ],
              "message": "Expected number, received nan"
            }
          ]
        }",
          "statusCode": 400,
        }
      `);
    });
  });

  describe('body', () => {
    it('should pass a valid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<ZodOpenApiTypeProvider>().post(
        '/',
        {
          schema: {
            body: z.object({
              jobId: z.string().openapi({
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
      app.withTypeProvider<ZodOpenApiTypeProvider>().post(
        '/',
        {
          schema: {
            body: z.object({
              jobId: z.coerce.number().openapi({
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
          "message": "{
          "body": [
            {
              "code": "invalid_type",
              "expected": "number",
              "received": "nan",
              "path": [
                "jobId"
              ],
              "message": "Expected number, received nan"
            }
          ]
        }",
          "statusCode": 400,
        }
      `);
    });
  });

  describe('headers', () => {
    it('should pass a valid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<ZodOpenApiTypeProvider>().get(
        '/',
        {
          schema: {
            headers: z.object({
              'job-id': z.string().openapi({
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
      app.withTypeProvider<ZodOpenApiTypeProvider>().get(
        '/',
        {
          schema: {
            headers: z.object({
              jobId: z.coerce.number().openapi({
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
          "message": "{
          "headers": [
            {
              "code": "invalid_type",
              "expected": "number",
              "received": "nan",
              "path": [
                "jobId"
              ],
              "message": "Expected number, received nan"
            }
          ]
        }",
          "statusCode": 400,
        }
      `);
    });
  });

  describe('params', () => {
    it('should pass a valid input', async () => {
      const app = fastify();

      app.setValidatorCompiler(validatorCompiler);
      app.withTypeProvider<ZodOpenApiTypeProvider>().get(
        '/:jobId',
        {
          schema: {
            params: z.object({
              jobId: z.string().openapi({
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
      app.withTypeProvider<ZodOpenApiTypeProvider>().get(
        '/:jobId',
        {
          schema: {
            params: z.object({
              jobId: z.coerce.number().openapi({
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
          "message": "{
          "params": [
            {
              "code": "invalid_type",
              "expected": "number",
              "received": "nan",
              "path": [
                "jobId"
              ],
              "message": "Expected number, received nan"
            }
          ]
        }",
          "statusCode": 400,
        }
      `);
    });
  });
});
