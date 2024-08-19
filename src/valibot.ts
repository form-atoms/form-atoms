/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { Getter } from "jotai";
import {
  ValiError,
  BaseSchema,
  isValiError,
  BaseIssue,
  BaseSchemaAsync,
  parseAsync,
} from "valibot";

import type { Validate, ValidateOn } from ".";

/**
 * Validate your field atoms with Valibot schemas. This function validates
 * on every "user" and "submit" event, in addition to other events you specify.
 *
 * @param schema - Valibot schema or a function that returns a Zod schema
 * @param config - Configuration options
 * @example
 * ```ts
 * import { }
 * const nameForm = formAtom({
 *   name: fieldAtom({
 *     validate: valibotValidate(string(), {
 *       on: "blur",
 *       when: "dirty",
 *     })
 *   })
 * })
 * ```
 */
export function createValibotValidator(parse: typeof parseAsync) {
  return function valibotValidate<Value>(
    schema: ((get: Getter) => ValibotSchema) | ValibotSchema,
    config: ValibotValidateConfig = {},
  ) {
    const {
      on,
      when,
      formatError = (err) => err.issues.map((iss) => iss.message),
    } = config;
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
              typeof schema === "function" ? schema(state.get) : schema;

            try {
              await parse(validator, state.value);
              result = [];
            } catch (err) {
              if (isValiError(err)) {
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
        or(config: Omit<ValibotValidateConfig, "formatError">) {
          const or = valibotValidate(schema, { formatError, ...config });
          ors.push(or);
          return chain;
        },
      },
    );

    return chain;
  };
}

export type ValibotValidateConfig = {
  /**
   * The event or events that triggers validation.
   */
  on?: ValibotValidateOn | ValibotValidateOn[];
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
  formatError?: (error: ValiError<ValibotSchema>) => string[];
};

export type ValibotSchema =
  | BaseSchema<unknown, unknown, BaseIssue<unknown>>
  | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>;

export type ValibotValidateOn = Exclude<ValidateOn, "user" | "submit">;
