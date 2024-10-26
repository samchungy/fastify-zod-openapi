import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySchema } from 'fastify';
import type { OpenAPIV3 } from 'openapi-types';
import type { AnyZodObject } from 'zod';
import type {
  ZodOpenApiComponentsObject,
  ZodOpenApiResponsesObject,
} from 'zod-openapi';
import { createComponents } from 'zod-openapi/api';

import {
  FASTIFY_ZOD_OPENAPI_COMPONENTS,
  FASTIFY_ZOD_OPENAPI_RESULTS,
} from './plugin';

type Transform = FastifyDynamicSwaggerOptions['transform'];

type TransformObject = FastifyDynamicSwaggerOptions['transformObject'];

export type FastifyZodOpenApiSchema = Omit<
  FastifySchema,
  'response' | 'headers' | 'querystring' | 'body' | 'params'
> & {
  response?: ZodOpenApiResponsesObject;
  headers?: AnyZodObject;
  querystring?: AnyZodObject;
  body?: AnyZodObject;
  params?: AnyZodObject;
};

export const fastifyZodOpenApiTransform: Transform = ({
  schema,
  url,
  ...opts
}) => {
  if (!schema || schema.hide) {
    return {
      schema,
      url,
    };
  }

  if (!('openapiObject' in opts)) {
    throw new Error('openapiObject was not found in the options');
  }

  const results = schema[FASTIFY_ZOD_OPENAPI_RESULTS];

  if (!results) {
    throw new Error('Please register the fastify-zod-openapi plugin');
  }

  opts.openapiObject[FASTIFY_ZOD_OPENAPI_COMPONENTS] ??= results.components;

  const transformedSchema: FastifySchema = {
    ...schema,
    ...results.results,
  };

  return {
    schema: transformedSchema,
    url,
  };
};

export const fastifyZodOpenApiTransformObject: TransformObject = (opts) => {
  if ('swaggerObject' in opts) {
    return opts.swaggerObject;
  }

  const components = opts.openapiObject[FASTIFY_ZOD_OPENAPI_COMPONENTS];

  if (!components) {
    return opts.openapiObject;
  }

  return {
    ...opts.openapiObject,
    components: createComponents(
      (opts.openapiObject.components ?? {}) as ZodOpenApiComponentsObject,
      components,
    ) as OpenAPIV3.ComponentsObject,
  };
};
