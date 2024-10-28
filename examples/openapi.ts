import 'zod-openapi/extend';

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import { z } from 'zod';

import {
  type FastifyZodOpenApiSchema,
  type FastifyZodOpenApiTypeProvider,
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransform,
  fastifyZodOpenApiTransformObject,
  serializerCompiler,
  validatorCompiler,
} from '../src';

const createApp = async () => {
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
    },
    transform: fastifyZodOpenApiTransform,
    transformObject: fastifyZodOpenApiTransformObject,
  });
  await app.register(fastifySwaggerUI, {
    routePrefix: '/documentation',
  });

  const JobIdSchema = z.string().openapi({
    description: 'Job ID',
    example: '60002023',
    ref: 'jobId',
  });

  app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method: 'POST',
    url: '/:jobId',
    schema: {
      params: z.object({
        foo: z.string().openapi({
          description: 'path parameter example',
          example: 'bar',
        }),
      }),
      querystring: z.object({
        baz: z.string().openapi({
          description: 'query string example',
          example: 'quz',
        }),
      }),
      body: z.object({
        jobId: JobIdSchema,
      }),
      headers: z.object({
        'my-header': z.string().openapi({
          description: 'header string example',
          example: 'xyz',
        }),
      }),
      response: {
        200: z.object({
          jobId: JobIdSchema,
        }),
        201: {
          content: {
            'application/json': {
              example: { jobId: '123' },
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
    handler: async (_req, res) =>
      res.send({
        jobId: '60002023',
      }),
  });
  await app.ready();
  return app;
};

const app = createApp();

export default app;
