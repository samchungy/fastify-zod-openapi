<p align="center">
  <h1 align="center">fastify-zod-openapi</h1>
</p>
<p align="center">
Fastify <a href="https://fastify.dev/docs/latest/Reference/Type-Providers/">type provider</a>, <a href="https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/">validation, serialization</a> and <a href="https://github.com/fastify/fastify-swagger">@fastify/swagger</a> support for <a href="https://github.com/samchungy/zod-openapi">zod-openapi</a>.
</p>
<div align="center">
<a href="https://www.npmjs.com/package/fastify-zod-openapi"><img src="https://img.shields.io/npm/v/fastify-zod-openapi"/><a>
<a href="https://www.npmjs.com/package/fastify-zod-openapi"><img src="https://img.shields.io/npm/dm/fastify-zod-openapi"/><a>
<a href="https://nodejs.org/en/"><img src="https://img.shields.io/badge/node-%3E%3D%2016.11-brightgreen"/><a>
<a href="https://github.com/samchungy/fastify-zod-openapi/actions/workflows/test.yml"><img src="https://github.com/samchungy/fastify-zod-openapi/actions/workflows/test.yml/badge.svg"/><a>
<a href="https://github.com/samchungy/fastify-zod-openapi/actions/workflows/release.yml"><img src="https://github.com/samchungy/fastify-zod-openapi/actions/workflows/release.yml/badge.svg"/><a>
<a href="https://github.com/seek-oss/skuba"><img src="https://img.shields.io/badge/🤿%20skuba-powered-009DC4"/><a>
</div>
<br>

## Install

Install via `npm` or `yarn`:

```bash
npm install zod zod-openapi fastify-zod-openapi
## or
yarn add zod zod-openapi fastify-zod-openapi
```

## Usage

```ts
import fastify from 'fastify';
import {
  type FastifyZodOpenApiSchema,
  type FastifyZodOpenApiTypeProvider,
  fastifyZodOpenApiPlugin,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-zod-openapi';
import { z } from 'zod';
import { extendZodWithOpenApi } from 'zod-openapi';

extendZodWithOpenApi(z);

const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
  method: 'POST',
  url: '/:jobId',
  schema: {
    body: z.string().openapi({
      description: 'Job ID',
      example: '60002023',
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
  handler: async (_req, res) =>
    res.send({
      jobId: '60002023',
    }),
});

await app.ready();
await app.listen({ port: 5000 });
```

## Usage with @fastify/swagger

```ts
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import {
  type FastifyZodOpenApiSchema,
  type FastifyZodOpenApiTypeProvider,
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-zod-openapi';
import { z } from 'zod';
import { type ZodOpenApiVersion, extendZodWithOpenApi } from 'zod-openapi';

extendZodWithOpenApi(z);

const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const openapi: ZodOpenApiVersion = '3.1.0';

await app.register(fastifyZodOpenApiPlugin, { openapi });
await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'hello world',
      version: '1.0.0',
    },
    openapi,
  },
  transform: fastifyZodOpenApiTransform,
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

## Caveats

At the moment, this plugin does \***\*not\*\*** support registering components. Future support will be added.

## Development

### Prerequisites

- Node.js LTS
- Yarn 1.x

```shell
yarn
yarn build
```

### Test

```shell
yarn test
```

### Lint

```shell
# Fix issues
yarn format

# Check for issues
yarn lint
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
