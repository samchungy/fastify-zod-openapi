import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySchema } from 'fastify';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { $ZodObject, $ZodType } from 'zod/v4/core';
import type {
  ZodObjectInput,
  ZodOpenApiParameters,
  ZodOpenApiResponsesObject,
  oas31,
} from 'zod-openapi';
import {
  type ComponentRegistry,
  createComponents,
  isAnyZodType,
  unwrapZodObject,
} from 'zod-openapi/api';

import { FASTIFY_ZOD_OPENAPI_CONFIG } from './plugin';

type Transform = NonNullable<FastifyDynamicSwaggerOptions['transform']>;

type TransformObject = NonNullable<
  FastifyDynamicSwaggerOptions['transformObject']
>;

type FastifyResponseSchema = $ZodType | Record<string, unknown>;

type FastifySwaggerSchemaObject = Omit<oas31.SchemaObject, 'required'> & {
  required?: string[] | boolean;
};

export type FastifyZodOpenApiSchema = Omit<
  FastifySchema,
  'response' | 'headers' | 'querystring' | 'body' | 'params'
> & {
  response?: ZodOpenApiResponsesObject;
  headers?: ZodObjectInput;
  querystring?: ZodObjectInput;
  body?: $ZodType;
  params?: ZodObjectInput;
};

export const createParams = (
  parameters: $ZodObject,
  type: keyof ZodOpenApiParameters,
  registry: ComponentRegistry,
  path: string[],
): Record<string, FastifySwaggerSchemaObject | oas31.ReferenceObject> => {
  const params: Record<
    string,
    FastifySwaggerSchemaObject | oas31.ReferenceObject
  > = {};

  for (const [key, value] of Object.entries(parameters._zod.def.shape)) {
    const parameter = registry.addParameter(value, path, {
      location: {
        in: type,
        name: key,
      },
    });

    if ('$ref' in parameter || !parameter.schema) {
      throw new Error('References not supported');
    }

    parameter.schema = {};

    params[key] = parameter as
      | FastifySwaggerSchemaObject
      | oas31.ReferenceObject;
  }
  return params;
};

export const createResponseSchema = (
  schema: FastifyResponseSchema,
  registry: ComponentRegistry,
  path: string[],
): unknown => {
  if (isAnyZodType(schema)) {
    return registry.addSchema(schema, path, {
      io: 'output',
      source: {
        type: 'mediaType',
      },
    });
  }
  return schema;
};

export const createContent = (
  content: unknown,
  ctx: {
    registry: ComponentRegistry;
    io: 'input' | 'output';
  },
  path: string[],
): unknown => {
  if (typeof content !== 'object' || content == null) {
    return content;
  }

  const contentObject: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(content)) {
    const unknownValue = value as unknown;
    if (
      typeof unknownValue === 'object' &&
      unknownValue !== null &&
      'schema' in unknownValue
    ) {
      const schemaPath = [...path, key, 'schema'];
      const schema = isAnyZodType(unknownValue.schema)
        ? ctx.registry.addSchema(unknownValue.schema, schemaPath, {
            io: ctx.io,
            source: {
              type: 'mediaType',
            },
          })
        : unknownValue.schema;

      contentObject[key] = {
        ...unknownValue,
        schema,
      };
      continue;
    }
    contentObject[key] = unknownValue;
  }
  return contentObject;
};

export const createResponse = (
  response: unknown,
  registry: ComponentRegistry,
  path: string[],
): unknown => {
  if (typeof response !== 'object' || response == null) {
    return response;
  }

  const responseObject: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(response)) {
    const unknownValue = value as unknown;
    if (isAnyZodType(unknownValue)) {
      responseObject[key] = registry.addSchema(unknownValue, [...path, key], {
        io: 'output',
        source: {
          type: 'mediaType',
        },
      });
      continue;
    }

    if (
      typeof unknownValue === 'object' &&
      unknownValue !== null &&
      'content' in unknownValue
    ) {
      const content = createContent(
        unknownValue.content,
        { registry, io: 'output' },
        [...path, key, 'content'],
      );
      responseObject[key] = {
        ...unknownValue,
        content,
      };
      continue;
    }
    responseObject[key] = unknownValue;
  }

  return responseObject;
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

  const { response, headers, querystring, body, params, ...rest } = schema;

  if (!('openapiObject' in opts)) {
    throw new Error('openapiObject was not found in the options');
  }

  const config = schema[FASTIFY_ZOD_OPENAPI_CONFIG];

  if (!config) {
    throw new Error('Please register the fastify-zod-openapi plugin');
  }

  const { registry } = config;

  // we need to access the components when we transform the document. Symbol's do not appear
  opts.openapiObject[FASTIFY_ZOD_OPENAPI_CONFIG] ??= config;

  const fastifySchema: FastifySchema = rest;

  const routeMethod = (opts.route.method as string).toLowerCase();
  const routePath = ['paths', url, routeMethod];

  if (isAnyZodType(body)) {
    fastifySchema.body = registry.addSchema(
      body,
      [...routePath, 'requestBody', 'content', 'application/json', 'schema'],
      {
        io: 'input',
        source: {
          type: 'mediaType',
        },
      },
    );
  }

  const maybeResponse = createResponse(response, registry, [
    ...routePath,
    'responses',
  ]);

  if (maybeResponse) {
    fastifySchema.response = maybeResponse;
  }

  if (isAnyZodType(querystring)) {
    const path = [...routePath, 'parameters', 'query'];
    const queryStringSchema = unwrapZodObject(querystring, 'input', path);

    fastifySchema.querystring = createParams(
      queryStringSchema,
      'query',
      registry,
      path,
    );
  }

  if (isAnyZodType(params)) {
    const path = [url, 'params'];
    const paramsSchema = unwrapZodObject(params, 'input', path);

    fastifySchema.params = createParams(paramsSchema, 'path', registry, path);
  }

  if (isAnyZodType(headers)) {
    const path = [url, 'headers'];

    const headersSchema = unwrapZodObject(headers, 'input', path);
    fastifySchema.headers = createParams(
      headersSchema,
      'header',
      registry,
      path,
    );
  }

  return {
    schema: fastifySchema,
    url,
  };
};

type SchemaSource = NonNullable<
  ReturnType<ComponentRegistry['components']['schemas']['input']['get']>
>['source'];

export const traverseObject = (
  openapiObject: Partial<OpenAPIV3.Document | OpenAPIV3_1.Document>,
  source: SchemaSource,
): OpenAPIV3_1.SchemaObject | undefined => {
  let index = 0;
  let current: unknown = openapiObject;
  while (index < source.path.length) {
    const key = source.path[index++] as keyof typeof current;
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined;
    }
    current = current[key];

    if (
      key === 'parameters' &&
      typeof current === 'object' &&
      Array.isArray(current) &&
      source.type === 'parameter'
    ) {
      const parameter = (current as OpenAPIV3_1.ParameterObject[]).find(
        (param) =>
          param.name === source.location.name &&
          param.in === source.location.in,
      );
      return parameter?.schema as OpenAPIV3_1.SchemaObject | undefined;
    }
  }
  return current as OpenAPIV3_1.SchemaObject;
};

export const fastifyZodOpenApiTransformObject: TransformObject = (opts) => {
  if ('swaggerObject' in opts) {
    return opts.swaggerObject;
  }

  const config = opts.openapiObject[FASTIFY_ZOD_OPENAPI_CONFIG];

  if (!config) {
    return opts.openapiObject;
  }

  const components = createComponents(
    config.registry,
    config.documentOpts ?? {},
  );

  for (const [, value] of config.registry.components.schemas.input) {
    const schema = traverseObject(opts.openapiObject, value.source);
    if (!schema) {
      throw new Error(
        `Schema not found in OpenAPI object: ${value.source.path.join('.')}`,
      );
    }
    Object.assign(schema, value.schemaObject);
  }

  for (const [, value] of config.registry.components.schemas.output) {
    const schema = traverseObject(opts.openapiObject, value.source);
    if (!schema) {
      throw new Error(
        `Schema not found in OpenAPI object: ${value.source.path.join('.')}`,
      );
    }
    Object.assign(schema, value.schemaObject);
  }

  return {
    ...opts.openapiObject,
    components: components as OpenAPIV3.ComponentsObject,
  };
};

export const fastifyZodOpenApiTransforms = {
  transform: fastifyZodOpenApiTransform,
  transformObject: fastifyZodOpenApiTransformObject,
};
