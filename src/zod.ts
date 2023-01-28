/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { Getter } from "jotai";
import type { z } from "zod";
import { ZodError, ZodType } from "zod";

import type { FieldAtomValidateOn, Validate } from ".";

/**
 * Validate your field atoms with Zod schemas.
 *
 * @param schema - Zod schema or a function that returns a Zod schema
 * @param config - Configuration options
 */
export function zodValidate<Value>(
  schema: ((get: Getter) => z.Schema) | z.Schema,
  config: ZodValidateConfig = {}
) {
  const {
    on,
    ifDirty,
    ifTouched,
    formatError = (err) => err.flatten().formErrors,
    fatal = false,
  } = config;
  const ors: ((
    state: Parameters<Exclude<Validate<Value>, undefined>>[0]
  ) => Promise<string[] | undefined>)[] = [];

  const chain = Object.assign(
    async (
      state: Parameters<Exclude<Validate<Value>, undefined>>[0]
    ): Promise<string[] | undefined> => {
      let result: string[] | undefined;
      const shouldHandleEvent = !on || on.includes(state.event);

      if (shouldHandleEvent) {
        const shouldHandleDirty =
          ifDirty === undefined || ifDirty === state.dirty;
        const shouldHandleTouched =
          ifTouched === undefined || ifTouched === state.touched;

        if (shouldHandleDirty && shouldHandleTouched) {
          const validator =
            schema instanceof ZodType ? schema : schema(state.get);

          try {
            await validator.parseAsync(state.value);
            result = [];
          } catch (err) {
            if (err instanceof ZodError) {
              return formatError(err);
            }

            throw err;
          }
        }
      }

      if (ors.length > 0) {
        for (const or of ors) {
          const errors = await or(state);

          if (errors?.length) {
            result = errors;
            break;
          } else if (errors) {
            result = errors;
          }

          if (fatal && result) {
            return result;
          }
        }
      }

      return result;
    },
    {
      or(config: Omit<ZodValidateConfig, "fatal" | "formatError">) {
        const or = zodValidate(schema, { formatError, fatal, ...config });
        ors.push(or);
        return chain;
      },
    }
  );

  return chain;
}

export type ZodValidateConfig = {
  /**
   * The event or events that triggers validation.
   */
  on?: FieldAtomValidateOn | FieldAtomValidateOn[];
  /**
   * Validate if the field has been touched.
   */
  ifTouched?: boolean;
  /**
   * Validate if the field is dirty.
   */
  ifDirty?: boolean;
  /**
   * Format the error message returned by the validator.
   *
   * @param error - A ZodError object
   */
  formatError?: (error: ZodError) => string[];
  /**
   * If true, the validation will stop after the first error.
   *
   * @default false
   */
  fatal?: boolean;
};