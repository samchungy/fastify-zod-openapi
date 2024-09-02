import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySchema } from 'fastify';
import type { OpenAPIV3 } from 'openapi-types';
import type { AnyZodObject, ZodObject, ZodRawShape, ZodType } from 'zod';
import { api } from 'zod-openapi';
import type {
  ZodOpenApiComponentsObject,
  ZodOpenApiParameters,
  ZodOpenApiResponsesObject,
  oas31,
} from 'zod-openapi';

import { FASTIFY_ZOD_OPENAPI_COMPONENTS } from './plugin';

type Transform = FastifyDynamicSwaggerOptions['transform'];

type TransformObject = FastifyDynamicSwaggerOptions['transformObject'];

interface FastifyResponseSchema {
  type: string;
  properties: ZodType | Record<string, unknown>;
}

type FastifySwaggerSchemaObject = Omit<oas31.SchemaObject, 'required'> & {
  required?: string[] | boolean;
};

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

export const isZodType = (object: unknown): object is ZodType =>
  Boolean(
    object &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      Object.getPrototypeOf((object as ZodType)?.constructor)?.name ===
        'ZodType',
  );

export const isZodObject = (
  object: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): object is ZodObject<any, any, any, any, any> =>
  Boolean(object && (object as ZodType)?.constructor?.name === 'ZodObject');

export const createParams = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  querystring: ZodObject<any, any, any, any, any>,
  type: keyof ZodOpenApiParameters,
  components: api.ComponentsObject,
  path: string[],
): Record<string, FastifySwaggerSchemaObject | oas31.ReferenceObject> =>
  Object.entries(querystring.shape as ZodRawShape).reduce(
    (acc, [key, value]: [string, ZodType]) => {
      const parameter = api.createParamOrRef(
        value,
        components,
        [...path, key],
        type,
        key,
      );

      if ('$ref' in parameter || !parameter.schema) {
        throw new Error('References not supported');
      }

      acc[key] = {
        ...parameter.schema,
        ...(parameter.required && { required: true }),
      };

      return acc;
    },
    {} as Record<string, FastifySwaggerSchemaObject | oas31.ReferenceObject>,
  );

export const createResponseSchema = (
  schema: FastifyResponseSchema,
  components: api.ComponentsObject,
  path: string[],
): unknown => {
  if (isZodType(schema.properties)) {
    return api.createMediaTypeSchema(schema.properties, components, 'output', [
      ...path,
      'schema',
    ]);
  }
  return schema;
};

export const createContent = (
  content: unknown,
  components: api.ComponentsObject,
  path: string[],
): unknown => {
  if (typeof content !== 'object' || content == null) {
    return content;
  }

  return Object.entries(content).reduce(
    (acc, [key, value]: [string, unknown]) => {
      if (typeof value === 'object' && value !== null && 'schema' in value) {
        const schema = createResponseSchema(
          value.schema as FastifyResponseSchema,
          components,
          [...path, 'schema'],
        );
        acc[key] = {
          ...value,
          schema,
        };
        return acc;
      }
      acc[key] = value;
      return acc;
    },
    {} as Record<string, unknown>,
  );
};

export const createResponse = (
  response: unknown,
  components: api.ComponentsObject,
  path: string[],
): unknown => {
  if (typeof response !== 'object' || response == null) {
    return response;
  }

  return Object.entries(response).reduce(
    (acc, [key, value]: [string, unknown]) => {
      if (isZodType(value)) {
        acc[key] = api.createMediaTypeSchema(value, components, 'output', [
          ...path,
          key,
        ]);
        return acc;
      }

      if (typeof value === 'object' && value !== null && 'content' in value) {
        const content = createContent(value.content, components, [
          ...path,
          'content',
        ]);
        acc[key] = {
          ...value,
          content,
        };
        return acc;
      }

      acc[key] = value;
      return acc;
    },
    {} as Record<string, unknown>,
  );
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

  const { response, headers, querystring, body, params } = schema;
  const components = schema[FASTIFY_ZOD_OPENAPI_COMPONENTS];

  if (!('openapiObject' in opts)) {
    throw new Error('openapiObject was not found in the options');
  }

  // we need to access the components when we transform the document. Symbol's do not appear
  opts.openapiObject[FASTIFY_ZOD_OPENAPI_COMPONENTS] ??= components;

  if (!components) {
    throw new Error('Please register the fastify-zod-openapi plugin');
  }

  const maybeResponse = createResponse(response, components, [url, 'response']);

  const transformedSchema: FastifySchema = {
    ...schema,
  };

  if (isZodType(body)) {
    transformedSchema.body = api.createMediaTypeSchema(
      body,
      components,
      'input',
      [url, 'body'],
    );
  }

  if (maybeResponse) {
    transformedSchema.response = maybeResponse;
  }

  if (isZodObject(querystring)) {
    transformedSchema.querystring = createParams(
      querystring,
      'query',
      components,
      [url, 'querystring'],
    );
  }

  if (isZodObject(params)) {
    transformedSchema.params = createParams(params, 'path', components, [
      url,
      'params',
    ]);
  }

  if (isZodObject(headers)) {
    transformedSchema.headers = createParams(headers, 'header', components, [
      url,
      'headers',
    ]);
  }

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
    components: api.createComponents(
      (opts.openapiObject.components ?? {}) as ZodOpenApiComponentsObject,
      components,
    ) as OpenAPIV3.ComponentsObject,
  };
};
