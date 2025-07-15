import {
  type FastifyDynamicSwaggerOptions,
  formatParamUrl,
} from '@fastify/swagger';
import type { FastifySchema } from 'fastify';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { $ZodObject, $ZodType } from 'zod/v4/core';
import type {
  ZodObjectInput,
  ZodOpenApiParameters,
  ZodOpenApiRequestBodyObject,
  ZodOpenApiResponseObject,
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

const createParams = (
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

const createResponse = (
  response: unknown,
  contentTypes: readonly string[] | undefined,
  registry: ComponentRegistry,
  responseComponents: Map<
    string,
    {
      referenceObject: oas31.ReferenceObject;
      path: string[];
    }
  >,
  path: string[],
): unknown => {
  if (typeof response !== 'object' || response == null) {
    return response;
  }

  const responsesObject: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(response)) {
    const unknownValue = value as unknown;
    if (isAnyZodType(unknownValue)) {
      if (!contentTypes?.length) {
        responsesObject[key] = registry.addSchema(
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

      const contentSchemas = contentTypes.map((contentType) =>
        registry.addSchema(
          unknownValue,
          [...path, key, 'content', contentType, 'schema'],
          {
            io: 'output',
            source: {
              type: 'mediaType',
            },
          },
        ),
      );

      responsesObject[key] = contentSchemas[0];
      continue;
    }

    const responsePath = [...path, key];

    const responseObject = registry.addResponse(
      unknownValue as ZodOpenApiResponseObject,
      responsePath,
    );

    if ('$ref' in responseObject && typeof responseObject.$ref === 'string') {
      responseComponents.set(responseObject.$ref, {
        referenceObject: responseObject,
        path: responsePath,
      });
    }

    responsesObject[key] = responseObject;
  }

  return responsesObject;
};

const createBody = (
  body: unknown,
  contentTypes: readonly string[] | undefined,
  routePath: string[],
  registry: ComponentRegistry,
  bodyComponents: Map<
    string,
    {
      referenceObject: oas31.ReferenceObject;
      path: string[];
    }
  >,
) => {
  if (!body) {
    return undefined;
  }

  if (isAnyZodType(body)) {
    if (!contentTypes?.length) {
      const bodySchema = registry.addSchema(
        body,
        [...routePath, 'requestBody', 'content', 'application/json', 'schema'],
        {
          io: 'input',
          source: {
            type: 'mediaType',
          },
        },
      );
      (bodySchema as oas31.SchemaObject)['x-fastify-zod-openapi-optional'] =
        body._zod.optin === 'optional';
      return bodySchema;
    }

    const bodySchemas = contentTypes.map((contentType) => {
      const schema = registry.addSchema(
        body,
        [...routePath, 'requestBody', 'content', contentType, 'schema'],
        {
          io: 'input',
          source: {
            type: 'mediaType',
          },
        },
      );
      (schema as oas31.SchemaObject)['x-fastify-zod-openapi-optional'] =
        body._zod.optin === 'optional';
      return schema;
    });

    return bodySchemas[0];
  }

  const requestBodyPath = [...routePath, 'requestBody'];

  const requestBodyObject = registry.addRequestBody(
    body as ZodOpenApiRequestBodyObject,
    requestBodyPath,
  );

  if (
    '$ref' in requestBodyObject &&
    typeof requestBodyObject.$ref === 'string'
  ) {
    bodyComponents.set(requestBodyObject.$ref, {
      referenceObject: requestBodyObject,
      path: requestBodyPath,
    });
  }

  return requestBodyObject;
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
  const routePath = ['paths', formatParamUrl(url), routeMethod];

  const maybeBody = createBody(
    body,
    rest.consumes,
    routePath,
    registry,
    config.fastifyComponents.requestBodies,
  );

  if (maybeBody) {
    fastifySchema.body = maybeBody;
  }

  const maybeResponse = createResponse(
    response,
    rest.produces,
    registry,
    config.fastifyComponents.responses,
    [...routePath, 'responses'],
  );

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

const resolveSchemaComponent = (
  object: oas31.SchemaObject | oas31.ReferenceObject,
  registry: ComponentRegistry,
): oas31.SchemaObject => {
  if (typeof object.$ref === 'string') {
    const id = object.$ref.replace('#/components/schemas/', '');
    return registry.components.schemas.ids.get(id) as oas31.SchemaObject;
  }

  return object as oas31.SchemaObject;
};

const traverseObject = (
  openapiObject: Partial<OpenAPIV3.Document | OpenAPIV3_1.Document>,
  source:
    | SchemaSource
    | {
        type: 'response' | 'requestBody';
        path: string[];
      },
  schemaObject: oas31.SchemaObject | oas31.ReferenceObject,
  registry: ComponentRegistry,
):
  | OpenAPIV3_1.SchemaObject
  | OpenAPIV3_1.ReferenceObject
  | OpenAPIV3_1.RequestBodyObject
  | undefined => {
  let index = 0;
  let current: unknown = openapiObject;
  while (index < source.path.length) {
    const key = source.path[index++] as string;
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined;
    }

    current = current[key as keyof typeof current];

    if (
      typeof current === 'object' &&
      current !== null &&
      '$ref' in current &&
      typeof current.$ref === 'string'
    ) {
      return current as OpenAPIV3_1.ReferenceObject;
    }

    if (key === 'requestBody' && typeof current === 'object') {
      const requestBody = current as OpenAPIV3_1.RequestBodyObject;

      if (source.type === 'requestBody') {
        // @ts-expect-error - changing the type altogether
        delete requestBody.content;
        delete requestBody.required;
        delete requestBody.description;
        Object.assign(requestBody, schemaObject);
        return requestBody;
      }

      const contentType = source.path?.[index + 1];

      if (!contentType) {
        return undefined;
      }

      const schema = requestBody.content?.[contentType]?.schema;

      if (!schema) {
        return undefined;
      }

      if ('$ref' in schema && schema.$ref) {
        return schema;
      }

      const resolved = resolveSchemaComponent(schemaObject, registry);

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

    if (
      key === 'responses' &&
      typeof current === 'object' &&
      source.type === 'response'
    ) {
      const responses = current as OpenAPIV3_1.ResponsesObject;
      const statusCode = source.path?.[index];

      if (!statusCode) {
        return undefined;
      }

      responses[statusCode] = schemaObject as OpenAPIV3_1.ResponseObject;
      return responses[statusCode];
    }
  }

  if (
    typeof current === 'object' &&
    current !== null &&
    Object.keys(current).length !== 0
  ) {
    return current as OpenAPIV3_1.SchemaObject;
  }

  return Object.assign(current as OpenAPIV3_1.SchemaObject, schemaObject);
};

const combineComponents = (
  existingComponents: OpenAPIV3.ComponentsObject,
  newComponents: OpenAPIV3.ComponentsObject,
) => {
  const allComponents: Array<keyof OpenAPIV3.ComponentsObject> = [
    'schemas',
    'parameters',
    'responses',
    'requestBodies',
    'securitySchemes',
    'examples',
    'links',
    'headers',
    'callbacks',
  ];

  for (const key of allComponents) {
    if (existingComponents[key] || newComponents[key]) {
      // @ts-expect-error - Combining components generically
      existingComponents[key] = {
        ...existingComponents[key],
        ...newComponents[key],
      };
    }
  }

  return existingComponents;
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

  for (const [, value] of config.fastifyComponents.responses) {
    const response = traverseObject(
      opts.openapiObject,
      {
        type: 'response',
        path: value.path,
      },
      value.referenceObject,
      config.registry,
    );
    if (!response) {
      throw new Error(
        `Response not found in OpenAPI object: ${value.path.join(' > ')}`,
      );
    }
  }

  for (const [, value] of config.fastifyComponents.requestBodies) {
    const requestBody = traverseObject(
      opts.openapiObject,
      {
        type: 'requestBody',
        path: value.path,
      },
      value.referenceObject,
      config.registry,
    );
    if (!requestBody) {
      throw new Error(
        `Request body not found in OpenAPI object: ${value.path.join(' > ')}`,
      );
    }
  }

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
        `Schema not found in OpenAPI object: ${value.source.path.join(' > ')}`,
      );
    }
  }

  return {
    ...opts.openapiObject,
    components: combineComponents(
      opts.openapiObject.components as OpenAPIV3.ComponentsObject,
      components as OpenAPIV3.ComponentsObject,
    ),
  };
};

export const fastifyZodOpenApiTransformers = {
  transform: fastifyZodOpenApiTransform,
  transformObject: fastifyZodOpenApiTransformObject,
};
