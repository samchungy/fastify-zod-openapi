import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySchema } from 'fastify';
import type { OpenAPIV3 } from 'openapi-types';
import type { ZodObject, ZodRawShape, ZodType } from 'zod';
import type {
  CreateDocumentOptions,
  ZodObjectInputType,
  ZodOpenApiComponentsObject,
  ZodOpenApiParameters,
  ZodOpenApiResponsesObject,
  ZodOpenApiVersion,
  oas31,
} from 'zod-openapi';
import {
  type ComponentsObject,
  createComponents,
  createMediaTypeSchema,
  createParamOrRef,
  getZodObject,
} from 'zod-openapi/api';

import {
  FASTIFY_ZOD_OPENAPI_COMPONENTS,
  FASTIFY_ZOD_OPENAPI_CONFIG,
} from './plugin';

type Transform = NonNullable<FastifyDynamicSwaggerOptions['transform']>;

type TransformObject = NonNullable<
  FastifyDynamicSwaggerOptions['transformObject']
>;

type FastifyResponseSchema = ZodType | Record<string, unknown>;

type FastifySwaggerSchemaObject = Omit<oas31.SchemaObject, 'required'> & {
  required?: string[] | boolean;
};

export type FastifyZodOpenApiSchema = Omit<
  FastifySchema,
  'response' | 'headers' | 'querystring' | 'body' | 'params'
> & {
  response?: ZodOpenApiResponsesObject;
  headers?: ZodObjectInputType;
  querystring?: ZodObjectInputType;
  body?: ZodObjectInputType;
  params?: ZodObjectInputType;
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
  components: ComponentsObject,
  path: string[],
  doucmentOpts?: CreateDocumentOptions,
): Record<string, FastifySwaggerSchemaObject | oas31.ReferenceObject> =>
  Object.entries(querystring.shape as ZodRawShape).reduce(
    (acc, [key, value]: [string, ZodType]) => {
      const parameter = createParamOrRef(
        value,
        components,
        [...path, key],
        type,
        key,
        doucmentOpts,
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
  components: ComponentsObject,
  path: string[],
  documentOpts?: CreateDocumentOptions,
): unknown => {
  if (isZodType(schema)) {
    return createMediaTypeSchema(
      schema,
      components,
      'output',
      [...path, 'schema'],
      documentOpts,
    );
  }
  return schema;
};

export const createContent = (
  content: unknown,
  components: ComponentsObject,
  path: string[],
  documentOpts?: CreateDocumentOptions,
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
          documentOpts,
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
  components: ComponentsObject,
  path: string[],
  documentOpts?: CreateDocumentOptions,
): unknown => {
  if (typeof response !== 'object' || response == null) {
    return response;
  }

  return Object.entries(response).reduce(
    (acc, [key, value]: [string, unknown]) => {
      if (isZodType(value)) {
        acc[key] = createMediaTypeSchema(
          value,
          components,
          'output',
          [...path, key],
          documentOpts,
        );
        return acc;
      }

      if (typeof value === 'object' && value !== null && 'content' in value) {
        const content = createContent(
          value.content,
          components,
          [...path, 'content'],
          documentOpts,
        );
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

  if (!('openapiObject' in opts)) {
    throw new Error('openapiObject was not found in the options');
  }

  const config = schema[FASTIFY_ZOD_OPENAPI_CONFIG];

  if (!config) {
    throw new Error('Please register the fastify-zod-openapi plugin');
  }

  const { components, documentOpts } = config;

  // we need to access the components when we transform the document. Symbol's do not appear
  opts.openapiObject[FASTIFY_ZOD_OPENAPI_COMPONENTS] ??= config.components;

  if (opts.openapiObject.openapi) {
    components.openapi = opts.openapiObject.openapi as ZodOpenApiVersion;
  }

  opts.openapiObject[FASTIFY_ZOD_OPENAPI_COMPONENTS] ??= components;

  const transformedSchema: FastifySchema = {
    ...schema,
  };

  if (isZodType(body)) {
    transformedSchema.body = createMediaTypeSchema(
      body,
      components,
      'input',
      [url, 'body'],
      documentOpts,
    );
  }

  const maybeResponse = createResponse(
    response,
    components,
    [url, 'response'],
    documentOpts,
  );

  if (maybeResponse) {
    transformedSchema.response = maybeResponse;
  }

  if (isZodType(querystring)) {
    const queryStringSchema = getZodObject(
      querystring as ZodObjectInputType,
      'input',
    );
    transformedSchema.querystring = createParams(
      queryStringSchema,
      'query',
      components,
      [url, 'querystring'],
      documentOpts,
    );
  }

  if (isZodType(params)) {
    const paramsSchema = getZodObject(params as ZodObjectInputType, 'input');
    transformedSchema.params = createParams(paramsSchema, 'path', components, [
      url,
      'params',
    ]);
  }

  if (isZodType(headers)) {
    const headersSchema = getZodObject(headers as ZodObjectInputType, 'input');
    transformedSchema.headers = createParams(
      headersSchema,
      'header',
      components,
      [url, 'headers'],
    );
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
    components: createComponents(
      (opts.openapiObject.components ?? {}) as ZodOpenApiComponentsObject,
      components,
    ) as OpenAPIV3.ComponentsObject,
  };
};
