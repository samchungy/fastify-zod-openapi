import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySchema } from 'fastify';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { $ZodObject, $ZodType } from 'zod/v4/core';
import type {
  ZodObjectInput,
  ZodOpenApiParameters,
  ZodOpenApiRequestBodyObject,
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
  body?: $ZodType | ZodOpenApiRequestBodyObject;
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

    const { in: inLocation, name, schema, ...rest } = parameter;

    params[key] = rest as FastifySwaggerSchemaObject;
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
      responseObject[key] = registry.addSchema(
        unknownValue,
        [...path, key, 'content', 'application/json', 'schema'],
        {
          io: 'output',
          source: {
            type: 'mediaType',
          },
        },
      );
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

export const setBody = (
  body: unknown,
  fastifySchema: FastifySchema,
  routePath: string[],
  registry: ComponentRegistry,
) => {
  if (!body) {
    return undefined;
  }

  if (isAnyZodType(body)) {
    const bodySchema = registry.addSchema(
      body,
      [...routePath, 'requestBody', 'shortForm'],
      {
        io: 'input',
        source: {
          type: 'mediaType',
        },
      },
    );
    (bodySchema as oas31.SchemaObject)['x-fastify-zod-openapi-optional'] =
      body._zod.optin === 'optional';
    fastifySchema.body = bodySchema;
    return;
  }

  const requestBody = registry.addRequestBody(
    body as ZodOpenApiRequestBodyObject,
    [...routePath, 'requestBody'],
  );

  fastifySchema.body = requestBody;
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

  setBody(body, fastifySchema, routePath, registry);

  const maybeResponse = createResponse(response, registry, [
    ...routePath,
    'responses',
  ]);

  if (maybeResponse) {
    fastifySchema.response = maybeResponse;
  }

  const parameterPath = [...routePath, 'parameters'];

  if (isAnyZodType(querystring)) {
    const queryStringSchema = unwrapZodObject(querystring, 'input', [
      ...parameterPath,
      'query',
    ]);

    fastifySchema.querystring = createParams(
      queryStringSchema,
      'query',
      registry,
      parameterPath,
    );
  }

  if (isAnyZodType(params)) {
    const paramsSchema = unwrapZodObject(params, 'input', [
      ...parameterPath,
      'path',
    ]);

    fastifySchema.params = createParams(
      paramsSchema,
      'path',
      registry,
      parameterPath,
    );
  }

  if (isAnyZodType(headers)) {
    const headersSchema = unwrapZodObject(headers, 'input', [
      ...parameterPath,
      'header',
    ]);
    fastifySchema.headers = createParams(
      headersSchema,
      'header',
      registry,
      parameterPath,
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

export const resolveSchemaComponent = (
  object: oas31.SchemaObject | oas31.ReferenceObject,
  registry: ComponentRegistry,
  io: 'input' | 'output',
): oas31.SchemaObject => {
  if (typeof object.$ref === 'string') {
    const id = object.$ref.replace('#/components/schemas/', '');
    return registry.components.schemas[io].get(id) as oas31.SchemaObject;
  }

  return object as oas31.SchemaObject;
};

export const traverseObject = (
  openapiObject: Partial<OpenAPIV3.Document | OpenAPIV3_1.Document>,
  source: SchemaSource,
  schemaObject: oas31.SchemaObject | oas31.ReferenceObject,
  registry: ComponentRegistry,
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
      key === 'requestBody' &&
      typeof current === 'object' &&
      source.path[index] === 'shortForm'
    ) {
      const requestBody = current as OpenAPIV3_1.RequestBodyObject;
      const schema = requestBody.content?.['application/json']?.schema;

      if (!schema) {
        return undefined;
      }

      const resolved = resolveSchemaComponent(schemaObject, registry, 'input');

      const description = schemaObject.description ?? resolved.description;
      if (description) {
        requestBody.description = description;
      }
      Object.assign(schema, schemaObject) as OpenAPIV3_1.SchemaObject;

      if (
        (schema as oas31.SchemaObject)['x-fastify-zod-openapi-optional'] ===
        false
      ) {
        requestBody.required = true;
        delete (schema as oas31.SchemaObject)['x-fastify-zod-openapi-optional'];
      }

      return schema;
    }

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

      if (parameter?.schema) {
        return Object.assign(
          parameter.schema,
          schemaObject,
        ) as OpenAPIV3_1.SchemaObject;
      }

      return undefined;
    }
  }

  return Object.assign(current as OpenAPIV3_1.SchemaObject, schemaObject);
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
    const schema = traverseObject(
      opts.openapiObject,
      value.source,
      value.schemaObject,
      config.registry,
    );
    if (!schema) {
      throw new Error(
        `Schema not found in OpenAPI object: ${value.source.path.join(' > ')}`,
      );
    }
  }

  for (const [, value] of config.registry.components.schemas.output) {
    const schema = traverseObject(
      opts.openapiObject,
      value.source,
      value.schemaObject,
      config.registry,
    );
    if (!schema) {
      throw new Error(
        `Schema not found in OpenAPI object: ${value.source.path.join('.')}`,
      );
    }
  }

  return {
    ...opts.openapiObject,
    components: components as OpenAPIV3.ComponentsObject,
  };
};

export const fastifyZodOpenApiTransformers = {
  transform: fastifyZodOpenApiTransform,
  transformObject: fastifyZodOpenApiTransformObject,
};
