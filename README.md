<p align="center">
  <h1 align="center">fastify-zod-openapi</h1>
</p>
<p align="center">
Fastify <a href="https://fastify.dev/docs/latest/Reference/Type-Providers/">type provider</a>, <a href="https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/">validation, serialization</a> and <a href="https://github.com/fastify/fastify-swagger">@fastify/swagger</a> support for <a href="https://github.com/samchungy/zod-openapi">zod-openapi</a>.
</p>
<div align="center">
<a href="https://www.npmjs.com/package/fastify-zod-openapi"><img src="https://img.shields.io/npm/v/fastify-zod-openapi"/><a>
<a href="https://www.npmjs.com/package/fastify-zod-openapi"><img src="https://img.shields.io/npm/dm/fastify-zod-openapi"/><a>
<a href="https://nodejs.org/en/"><img src="https://img.shields.io/badge/node-%3E%3D%2020-brightgreen"/><a>
<a href="https://github.com/samchungy/fastify-zod-openapi/actions/workflows/test.yml"><img src="https://github.com/samchungy/fastify-zod-openapi/actions/workflows/test.yml/badge.svg"/><a>
<a href="https://github.com/samchungy/fastify-zod-openapi/actions/workflows/release.yml"><img src="https://github.com/samchungy/fastify-zod-openapi/actions/workflows/release.yml/badge.svg"/><a>
<a href="https://github.com/seek-oss/skuba"><img src="https://img.shields.io/badge/🤿%20skuba-powered-009DC4"/><a>
</div>
<br>

## Install

Install via `npm`, `pnpm` or `pnpm`:

```bash
npm install zod zod-openapi fastify-zod-openapi
## or
pnpm add zod zod-openapi fastify-zod-openapi
## or
pnpm install zod-openapi fastify-zod-openapi
```

## Usage

```ts
import 'zod-openapi/extend';
import fastify from 'fastify';
import {
  type FastifyZodOpenApiSchema,
  type FastifyZodOpenApiTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-zod-openapi';
import { z } from 'zod';

const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
  method: 'POST',
  url: '/:jobId',
  schema: {
    body: z.object({
      jobId: z.string().openapi({
        description: 'Job ID',
        example: '60002023',
      }),
    }),
    response: {
      201: z.object({
        jobId: z.string().openapi({
          description: 'Job ID',
          example: '60002023',
        }),
      }),
    },
  } satisfies FastifyZodOpenApiSchema,
  handler: async (req, res) => {
    await res.send({ jobId: req.body.jobId });
  },
});

await app.ready();
await app.listen({ port: 5000 });
```

## Usage with plugins

```ts
import 'zod-openapi/extend';
import { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { z } from 'zod';

const plugin: FastifyPluginAsyncZodOpenApi = async (fastify, _opts) => {
  fastify.route({
    method: 'POST',
    url: '/',
    // Define your schema
    schema: {
      body: z.object({
        jobId: z.string().openapi({
          description: 'Job ID',
          example: '60002023',
        }),
      }),
      response: {
        201: z.object({
          jobId: z.string().openapi({
            description: 'Job ID',
            example: '60002023',
          }),
        }),
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async (req, res) => {
      await res.send({ jobId: req.body.jobId });
    },
  });
};

app.register(plugin);
```

## Usage with @fastify/swagger

```ts
import 'zod-openapi/extend';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import {
  type FastifyZodOpenApiSchema,
  type FastifyZodOpenApiTypeProvider,
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransform,
  fastifyZodOpenApiTransformObject,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-zod-openapi';
import { z } from 'zod';
import { type ZodOpenApiVersion } from 'zod-openapi';

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
    openapi: '3.0.3' satisfies ZodOpenApiVersion; // If this is not specified, it will default to 3.1.0
  },
  transform: fastifyZodOpenApiTransform,
  transformObject: fastifyZodOpenApiTransformObject,
});
await app.register(fastifySwaggerUI, {
  routePrefix: '/documentation',
});

app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
  method: 'POST',
  url: '/',
  schema: {
    body: z.string().openapi({
      description: 'Job ID',
      example: '60002023',
    }),
    response: {
      201: {
        content: {
          'application/json': {
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
await app.listen({ port: 5000 });
```

### Declaring Components

To declare components follow the documentation as declared [here](https://github.com/samchungy/zod-openapi#creating-components).

If you wish to declare the components manually you will need to do so via the plugin's options. You will also need
to create a custom SerializerCompiler to make use of [fast-json-stringify](https://github.com/fastify/fast-json-stringify).

```ts
await app.register(fastifyZodOpenApiPlugin, {
  components: { schema: mySchema },
});

const customSerializerCompiler = createSerializerCompiler({
  components,
});
```

Alternatively, you can use `JSON.stringify` instead.

```ts
const customSerializerCompiler = createSerializerCompiler({
  stringify: JSON.stringify,
});
```

Please note: the `responses`, `parameters` components do not appear to be supported by the `@fastify/swagger` library.

### Custom Response Serializer

The default response serializer `serializerCompiler` uses [fast-json-stringify](https://github.com/fastify/fast-json-stringify). Under the hood, the schema passed to the response is transformed using OpenAPI 3.1.0 and passed to `fast-json-stringify` as a JSON Schema.

If you wish are running into any compatibility issues or wish to restore the previous `JSON.stringify` functionality, you can use the `createSerializerCompiler` function.

```ts
const customSerializerCompiler = createSerializerCompiler({
  stringify: JSON.stringify,
});
```

### Create Document Options

If you wish to use [CreateDocumentOptions](https://github.com/samchungy/zod-openapi#createdocumentoptions), pass it in via the plugin options:

```ts
await app.register(fastifyZodOpenApiPlugin, {
  documentOpts: {
    unionOneOf: true,
  },
});
```

## Credits

[fastify-type-provider-zod](https://github.com/turkerdev/fastify-type-provider-zod): Big kudos to this library for lighting the way with how to create type providers, validators and serializers. fastify-zod-openapi is just an extension to this library whilst adding support for the functionality of zod-openapi.

## Development

### Prerequisites

- Node.js LTS
- pnpm

```shell
pnpm install
pnpm build
```

### Test

```shell
pnpm test
```

### Lint

```shell
# Fix issues
pnpm format

# Check for issues
pnpm lint
```

### Release

To release a new version

1. Create a [new GitHub Release](https://github.com/samchungy/zod-openapi/releases/new)
2. Select `🏷️ Choose a tag`, enter a version number. eg. `v1.2.0` and click `+ Create new tag: vX.X.X on publish`.
3. Click the `Generate release notes` button and adjust the description.
4. Tick the `Set as the latest release` box and click `Publish release`. This will trigger the `Release` workflow.
5. Check the `Pull Requests` tab for a PR labelled `Release vX.X.X`.
6. Click `Merge Pull Request` on that Pull Request to update main with the new package version.

To release a new beta version

1. Create a [new GitHub Release](https://github.com/samchungy/fastify-zod-openapi/releases/new)
2. Select `🏷️ Choose a tag`, enter a version number with a `-beta.X` suffix eg. `v1.2.0-beta.1` and click `+ Create new tag: vX.X.X-beta.X on publish`.
3. Click the `Generate release notes` button and adjust the description.
4. Tick the `Set as a pre-release` box and click `Publish release`. This will trigger the `Prerelease` workflow.
