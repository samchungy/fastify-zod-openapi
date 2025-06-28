import type { FastifySchemaCompiler } from 'fastify';
import type { ZodType } from 'zod/v4';

import { RequestValidationError } from './validationError';

/**
 * Enables zod-openapi schema validation
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify'
 *
 * const server = Fastify().setValidatorCompiler(validatorCompiler)
 * ```
 */
export const validatorCompiler: FastifySchemaCompiler<ZodType> =
  ({ schema }) =>
  (value) => {
    const result = schema.safeParse(value);

    if (!result.success) {
      return {
        error: result.error.issues.map(
          (issue) =>
            new RequestValidationError(
              issue.code,
              `/${issue.path.join('/')}`,
              `#/${issue.path.join('/')}/${issue.code}`,
              issue.message,
              {
                issue,
                error: result.error,
              },
            ),
        ) as unknown as Error, // Types are wrong https://github.com/fastify/fastify/pull/5787
      };
    }

    return { value: result.data };
  };
