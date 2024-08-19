/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { Getter } from "jotai";
import type { z } from "zod";
import { ZodError, ZodType } from "zod";

import type { Validate, ValidateOn } from ".";

/**
 * Validate your field atoms with Zod schemas. This function validates
 * on every "user" and "submit" event, in addition to other events you specify.
 *
 * @param schema - Zod schema or a function that returns a Zod schema
 * @param config - Configuration options
 * @example
 * ```ts
 * const schema = z.object({
 *  name: z.string().min(3),
 * });
 *
 * const nameForm = formAtom({
 *   name: fieldAtom({
 *     validate: zodValidate(schema.shape.name, {
 *       on: "blur",
 *       when: "dirty",
 *     })
 *   })
 * })
 * ```
 */
export function zodValidate<Value>(
  schema: ((get: Getter) => z.Schema) | z.Schema,
  config: ZodValidateConfig = {},
) {
  const { on, when, formatError = (err) => err.flatten().formErrors } = config;
  const ors: ((
    state: Parameters<Exclude<Validate<Value>, undefined>>[0],
  ) => Promise<string[] | undefined>)[] = [];
  const ifDirty = !!when?.includes("dirty");
  const ifTouched = !!when?.includes("touched");

  const chain = Object.assign(
    async (
      state: Parameters<Exclude<Validate<Value>, undefined>>[0],
    ): Promise<string[] | undefined> => {
      let result: string[] | undefined;
      const shouldHandleEvent =
        state.event === "user" ||
        state.event === "submit" ||
        !!on?.includes(state.event);

      if (shouldHandleEvent) {
        if (
          when === undefined ||
          (ifDirty && state.dirty) ||
          (ifTouched && state.touched)
        ) {
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
            result = result ? result.concat(errors) : errors;
          } else if (errors) {
            result = result ? result.concat(errors) : errors;
          }

          if (result) {
            return result;
          }
        }
      }

      return result;
    },
    {
      or(config: Omit<ZodValidateConfig, "formatError">) {
        const or = zodValidate(schema, { formatError, ...config });
        ors.push(or);
        return chain;
      },
    },
  );

  return chain;
}

export type ZodValidateConfig = {
  /**
   * The event or events that triggers validation.
   */
  on?: ZodValidateOn | ZodValidateOn[];
  /**
   * Validate if the field is:
   * - `touched`
   * - `dirty`
   */
  when?: "touched" | "dirty" | ("touched" | "dirty")[];
  /**
   * Format the error message returned by the validator.
   *
   * @param error - A ZodError object
   */
  formatError?: (error: ZodError) => string[];
};

export type ZodValidateOn = Exclude<ValidateOn, "user" | "submit">;
