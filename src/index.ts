import type {
  Atom,
  ExtractAtomUpdate,
  ExtractAtomValue,
  Getter,
  Setter,
  WritableAtom,
} from "jotai";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithReset, RESET } from "jotai/utils";
import * as React from "react";
import { setPath } from "./utils";

//
// Forms
//

/**
 * An atom that derives its state fields atoms and allows you to submit,
 * validate, and reset your form.
 *
 * @param {FormAtomFields} fields - An object containing field atoms to
 *   be included in the form. Field atoms can be deeply nested in
 *   objects and arrays.
 * @returns The `formAtom` function returns a Jotai `Atom`
 *   comprised of other atoms for managing the state of the form.
 */
export function formAtom<Fields extends FormAtomFields>(
  fields: Fields
): FormAtom<Fields> {
  const fieldsAtom = atomWithReset(fields);
  const valuesAtom = atom((get) => {
    const values = {} as FormAtomValues<Fields>;

    walkFields(fields, (field, path) => {
      const fieldAtom = get(field);
      setPath(values, path, get(fieldAtom.value));
    });

    return values;
  });

  async function validateFields(
    get: Getter,
    set: Setter,
    event: FieldAtomValidateOn
  ) {
    const promises: Promise<boolean>[] = [];

    walkFields(fields, (nextField) => {
      async function validate(field: typeof nextField) {
        const fieldAtom = get(field);
        const value = get(fieldAtom.value);
        const dirty = get(fieldAtom.dirty);
        // This pointer prevents a stale validation result from being
        // set after the most recent validation has been performed.
        const ptr = get(fieldAtom._validateCount) + 1;
        set(fieldAtom._validateCount, ptr);

        if (event === "user" || event === "submit") {
          set(fieldAtom.touched, true);
        }

        const maybePromise = fieldAtom._validateCallback?.({
          get,
          value,
          dirty,
          touched: get(fieldAtom.touched),
          event,
        });

        let errors: string[];

        if (isPromise(maybePromise)) {
          set(fieldAtom.validateStatus, "validating");
          errors = (await maybePromise) ?? [];
        } else {
          errors = maybePromise ?? [];
        }

        if (ptr === get(fieldAtom._validateCount)) {
          set(fieldAtom.errors, errors);
          set(
            fieldAtom.validateStatus,
            errors.length > 0 ? "invalid" : "valid"
          );
        }

        if (errors && errors.length) {
          return false;
        }

        return true;
      }

      promises.push(validate(nextField));
    });

    await Promise.all(promises);
  }

  const validateResultAtom = atom<FormAtomValidateStatus>((get) => {
    let status: FormAtomValidateStatus = "valid";

    walkFields(fields, (field) => {
      const fieldAtom = get(field);
      const fieldStatus = get(fieldAtom.validateStatus);

      if (fieldStatus === "validating") {
        status = "validating";
        return false;
      } else if (fieldStatus === "invalid") {
        status = "invalid";
        return false;
      }
    });

    return status;
  });

  const validateAtom = atom<null, void | FieldAtomValidateOn>(
    null,
    (get, set, event = "user") => {
      event && validateFields(get, set, event);
    }
  );

  const errorsAtom = atom((get) => {
    const errors = {} as FormAtomErrors<Fields>;

    walkFields(fields, (field, path) => {
      const fieldAtom = get(field);
      setPath(errors, path, get(fieldAtom.errors));
    });

    return errors;
  });

  const submitCountAtom = atom(0);
  const submitStatusCountAtom = atom(0);
  const submitResultAtom = atom<FormAtomSubmitStatus>("idle");
  const submitAtom = atom<
    null,
    (values: FormAtomValues<Fields>) => void | Promise<void>
  >(null, (get, set, onSubmit) => {
    async function resolveSubmit() {
      // This pointer prevents a stale validation result from being
      // set after the most recent validation has been performed.
      const ptr = get(submitStatusCountAtom) + 1;
      set(submitStatusCountAtom, ptr);
      set(submitCountAtom, (count) => ++count);
      await validateFields(get, set, "submit");
      const validateStatus = get(validateResultAtom);

      if (validateStatus === "invalid") {
        return (
          ptr === get(submitStatusCountAtom) && set(submitResultAtom, "idle")
        );
      }

      const submission = onSubmit(get(valuesAtom));

      try {
        if (isPromise(submission)) {
          ptr === get(submitStatusCountAtom) &&
            set(submitResultAtom, "submitting");
          await submission;
        }
        // eslint-disable-next-line no-empty
      } catch (err) {
      } finally {
        if (ptr === get(submitStatusCountAtom)) {
          set(submitResultAtom, "submitted");
        }
      }
    }

    resolveSubmit();
  });

  const resetAtom = atom(null, (get, set) => {
    walkFields(fields, (field) => {
      const fieldAtom = get(field);
      set(fieldAtom.reset);
    });

    set(submitStatusCountAtom, (current) => ++current);
    set(submitResultAtom, "idle");
  });

  return atom({
    fields: fieldsAtom,
    values: valuesAtom,
    errors: errorsAtom,
    validate: validateAtom,
    validateStatus: validateResultAtom,
    submit: submitAtom,
    submitStatus: submitResultAtom,
    submitCount: submitCountAtom,
    reset: resetAtom,
  });
}

/**
 * A hook that returns an object that contains the `fieldAtoms` and actions to
 * validate, submit, and reset the form.
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns A set of functions that can be used to interact
 *   with the form.
 */
export function useFormAtom<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): UseFormAtom<Fields> {
  const form = useAtomValue(formAtom, scope);
  const fieldAtoms = useAtomValue(form.fields, scope);
  const reset = useSetAtom(form.reset, scope);
  const validate = useSetAtom(form.validate, scope);
  const handleSubmit = useSetAtom(form.submit, scope);
  const [, startTransition] = useTransition();

  return React.useMemo(
    () => ({
      fieldAtoms: fieldAtoms as Fields,
      validate() {
        startTransition(() => {
          validate("user");
        });
      },
      reset,
      submit(onSubmit) {
        return (e) => {
          e?.preventDefault();
          return handleSubmit(onSubmit);
        };
      },
    }),
    [fieldAtoms, validate, reset, handleSubmit]
  );
}

/**
 * A hook that returns the primary state of the form atom including values, errors,
 * submit and validation status, as well as the `fieldAtoms`. Note that this
 * hook will cuase its parent component to re-render any time those states
 * change, so it can be useful to use more targeted state hooks like
 * `useFormAtomStatus`.
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 */
export function useFormAtomState<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomState<Fields> {
  const form = useAtomValue(formAtom, scope);
  const fieldAtoms = useAtomValue(form.fields, scope);
  const submitCount = useAtomValue(form.submitCount, scope);
  const submitStatus = useAtomValue(form.submitStatus, scope);
  const validateStatus = useAtomValue(form.validateStatus, scope);
  const values = useAtomValue(form.values, scope);
  const errors = useAtomValue(form.errors, scope);

  return React.useMemo(
    () => ({
      fieldAtoms: fieldAtoms as Fields,
      values: values as any,
      errors: errors as any,
      submitCount,
      submitStatus,
      validateStatus,
    }),
    [fieldAtoms, values, errors, submitCount, submitStatus, validateStatus]
  );
}

/**
 * A hook that returns a set of actions that can be used to update the state
 * of the form atom. This includes updating fields, submitting, resetting,
 * and validating the form.
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 */
export function useFormAtomActions<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomActions<Fields> {
  const form = useAtomValue(formAtom, scope);
  const updateFields = useSetAtom(form.fields, scope);
  const reset = useSetAtom(form.reset, scope);
  const validate = useSetAtom(form.validate, scope);
  const handleSubmit = useSetAtom(form.submit, scope);
  const submit = React.useCallback(
    (values: Parameters<typeof handleSubmit>[0]) =>
      (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        handleSubmit(values);
      },
    [handleSubmit]
  );
  const [, startTransition] = useTransition();

  return React.useMemo(
    () => ({
      updateFields,
      reset,
      validate() {
        startTransition(() => {
          validate("user");
        });
      },
      submit,
    }),
    [updateFields, reset, validate, submit]
  );
}

/**
 * A hook that returns the errors of the form atom.
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form data.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The errors of the form.
 */
export function useFormAtomErrors<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
) {
  const form = useAtomValue(formAtom, scope);
  return useAtomValue(form.errors, scope);
}

/**
 * A hook that returns the values of the form atom
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The values of the form.
 */
export function useFormAtomValues<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
) {
  const form = useAtomValue(formAtom, scope);
  return useAtomValue(form.values, scope);
}

/**
 * A hook that returns the `submitStatus` and `validateStatus` of
 * the form atom.
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns An object containing the `submitStatus` and
 *   `validateStatus` of the form
 */
export function useFormAtomStatus<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomStatus {
  const form = useAtomValue(formAtom);
  const submitStatus = useAtomValue(form.submitStatus, scope);
  const validateStatus = useAtomValue(form.validateStatus, scope);

  return React.useMemo(
    () => ({ submitStatus, validateStatus }),
    [submitStatus, validateStatus]
  );
}

/**
 * A hook that returns a callback for handling form submission.
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns A callback for handling form submission. The callback
 *   takes the form values as an argument and returs an additional callback
 *   that invokes `event.preventDefault()` if it receives an event as its argument.
 */
export function useFormAtomSubmit<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
) {
  const form = useAtomValue(formAtom, scope);
  const handleSubmit = useSetAtom(form.submit, scope);
  return React.useCallback(
    (values: Parameters<typeof handleSubmit>[0]) =>
      (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        handleSubmit(values);
      },
    [handleSubmit]
  );
}

//
// Fields
//

/**
 * An atom that represents a field in a form. It manages state for the field,
 * including the name, value, errors, dirty, validation, and touched state.
 *
 * @param {FieldAtomConfig<Value>} config - The initial state and configuration of the field.
 * @returns A FieldAtom.
 */
export function fieldAtom<Value>(
  config: FieldAtomConfig<Value>
): FieldAtom<Value> {
  const nameAtom = atomWithReset(config.name);
  const valueAtom = atomWithReset<Value>(config.value);
  const touchedAtom = atomWithReset(config.touched ?? false);
  const dirtyAtom = atom((get) => {
    return get(valueAtom) !== config.value;
  });
  const errorsAtom = atom<string[]>([]);

  const validateCountAtom = atom(0);
  const validateResultAtom = atom<FormAtomValidateStatus>("valid");
  const validateAtom = atom<null, void | FieldAtomValidateOn>(
    null,
    (get, set, event = "user") => {
      async function resolveErrors() {
        if (!event) return;
        // This pointer prevents a stale validation result from being
        // set to state after the most recent invocation of validate.
        const ptr = get(validateCountAtom) + 1;
        set(validateCountAtom, ptr);
        const dirty = get(dirtyAtom);
        const value = get(valueAtom);

        if (event === "user" || event === "submit") {
          set(touchedAtom, true);
        }

        let errors: string[] = [];

        const maybeValidatePromise = config.validate?.({
          get,
          dirty,
          touched: get(touchedAtom),
          value,
          event: event,
        });

        if (isPromise(maybeValidatePromise)) {
          ptr === get(validateCountAtom) &&
            set(validateResultAtom, "validating");
          errors = (await maybeValidatePromise) ?? [];
        } else {
          errors = maybeValidatePromise ?? [];
        }

        if (ptr === get(validateCountAtom)) {
          set(errorsAtom, errors);
          set(validateResultAtom, errors.length > 0 ? "invalid" : "valid");
        }
      }

      resolveErrors();
    }
  );

  const refAtom = atom<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  >(null);

  const resetAtom = atom<null, void>(null, (get, set) => {
    set(errorsAtom, []);
    set(touchedAtom, RESET);
    set(valueAtom, RESET);
    // Need to set a new pointer to prevent stale validation results
    // from being set to state after this invocation.
    set(validateCountAtom, (count) => ++count);
    set(validateResultAtom, "valid");
  });

  return atom({
    name: nameAtom,
    value: valueAtom,
    touched: touchedAtom,
    dirty: dirtyAtom,
    validate: validateAtom,
    validateStatus: validateResultAtom,
    errors: errorsAtom,
    reset: resetAtom,
    ref: refAtom,
    _validateCallback: config.validate,
    _validateCount: validateCountAtom,
  });
}

/**
 * A hook that returns a set of actions that can be used to interact with the
 * field atom state.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns A set of actions that can be used to interact with the field atom.
 */
export function useFieldAtomActions<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomActions<Value> {
  const field = useAtomValue(fieldAtom, scope);
  const setValue = useSetAtom(field.value, scope);
  const setTouched = useSetAtom(field.touched, scope);
  const setErrors = useSetAtom(field.errors, scope);
  const validate = useSetAtom(field.validate, scope);
  const reset = useSetAtom(field.reset);
  const ref = useAtomValue(field.ref, scope);
  const [, startTransition] = useTransition();

  return React.useMemo(
    () => ({
      validate() {
        startTransition(() => {
          validate("user");
        });
      },
      setValue(value) {
        setValue(value);
        startTransition(() => {
          validate("change");
        });
      },
      setTouched(touched) {
        setTouched(touched);

        if (touched) {
          startTransition(() => {
            validate("touch");
          });
        }
      },
      setErrors,
      focus() {
        ref?.focus();
      },
      reset,
    }),
    [setErrors, reset, validate, setValue, setTouched, ref]
  );
}

/**
 * A hook that returns a set of props that can be destructured
 * directly into an `<input>`, `<select>`, or `<textarea>` element.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns A set of props that can be destructured directly into an `<input>`,
 *   `<select>`, or `<textarea>` element.
 */
export function useFieldAtomProps<
  Value extends string | number | readonly string[]
>(
  fieldAtom: FieldAtom<string | number | readonly string[]>,
  scope?: Scope
): FieldAtomProps<Value> {
  const field = useAtomValue(fieldAtom, scope);
  const name = useAtomValue(field.name, scope);
  const [value, setValue] = useAtom(field.value, scope);
  const setTouched = useSetAtom(field.touched, scope);
  const validateStatus = useAtomValue(field.validateStatus, scope);
  const validate = useSetAtom(field.validate, scope);
  const ref = useSetAtom(field.ref, scope);
  const [, startTransition] = useTransition();

  return React.useMemo(
    () => ({
      name,
      value: value as Value,
      "aria-invalid": validateStatus === "invalid",
      ref,
      onBlur() {
        setTouched(true);
        startTransition(() => {
          validate("blur");
        });
      },
      onChange(event) {
        setValue(event.target.value);

        startTransition(() => {
          validate("change");
        });
      },
    }),
    [name, value, validateStatus, ref, setTouched, validate, setValue]
  );
}

/**
 * A hook that returns the state of a field atom. This includes the field's
 * value, whether it has been touched, whether it is dirty, the validation status,
 * and any errors.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The state of the field atom.
 */
export function useFieldAtomState<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomState<Value> {
  const field = useAtomValue(fieldAtom, scope);
  const value = useAtomValue(field.value, scope);
  const touched = useAtomValue(field.touched, scope);
  const dirty = useAtomValue(field.dirty, scope);
  const validateStatus = useAtomValue(field.validateStatus, scope);
  const errors = useAtomValue(field.errors, scope);

  return React.useMemo(
    () => ({
      value: value as unknown as Value,
      touched,
      dirty,
      validateStatus,
      errors,
    }),
    [value, touched, dirty, validateStatus, errors]
  );
}

/**
 * A hook that returns the value of a field atom.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The value of the field atom.
 */
export function useFieldAtomValue<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
) {
  const field = useAtomValue(fieldAtom, scope);
  return useAtomValue(field.value, scope);
}

/**
 * A hook that returns the errors of a field atom.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The errors of the field atom.
 */
export function useFieldAtomErrors<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
) {
  const field = useAtomValue(fieldAtom, scope);
  return useAtomValue(field.errors, scope);
}

/**
 * A hook that returns `props`, `state`, and `actions` of a field atom from
 * `useFieldAtomProps`, `useFieldAtomState`, and `useFieldAtomActions`.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The errors of the field atom.
 */
export function useFieldAtom<Value extends string | number | readonly string[]>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): UseFieldAtom<Value> {
  // @ts-expect-error: there's a RESET atom causing issues here
  const props = useFieldAtomProps<Value>(fieldAtom, scope);
  const actions = useFieldAtomActions<Value>(fieldAtom, scope);
  const state = useFieldAtomState<Value>(fieldAtom, scope);
  return React.useMemo<UseFieldAtom<Value>>(
    () => ({ props, actions, state }),
    [props, actions, state]
  );
}

const useTransition: () => [boolean, typeof React.startTransition] =
  typeof React.useTransition === "function"
    ? React.useTransition
    : () => [false, (fn) => fn()];

function isPromise(value: any): value is Promise<any> {
  return typeof value === "object" && typeof value.then === "function";
}

function isAtom(maybeAtom: any): maybeAtom is FieldAtom<any> {
  return (
    maybeAtom !== null &&
    typeof maybeAtom === "object" &&
    (typeof maybeAtom.read === "function" ||
      typeof maybeAtom.write === "function")
  );
}

/**
 * A function that walks through an object containing nested field atoms
 * and calls a visitor function for each atom it finds.
 *
 * @param {FormAtomFields} fields - An object containing nested field atoms
 * @param visitor - A function that will be called for each field atom. You can
 *  exit early by returning `false` from the function.
 * @param path - The base path of the field atom.
 */
export function walkFields<Fields extends FormAtomFields>(
  fields: Fields,
  visitor: (field: FieldAtom<any>, path: string[]) => void | false,
  path: string[] = []
) {
  for (const key in fields) {
    path.push(key);
    const field = fields[key];

    if (isAtom(field)) {
      if (visitor(field, path) === false) return;
    } else if (Array.isArray(field)) {
      for (const key in field) {
        path.push(key);
        const subField = field[key];

        if (isAtom(subField)) {
          if (visitor(subField, path) === false) return;
        } else {
          walkFields(subField, visitor, path);
        }

        path.pop();
      }
    } else if (typeof field === "object") {
      walkFields(field, visitor, path);
    }

    path.pop();
  }
}

export { Provider } from "jotai";

/**
 * A form submission status
 */
export type FormAtomSubmitStatus = "idle" | "submitting" | "submitted";
/**
 * A form and field validation status
 */
export type FormAtomValidateStatus = "validating" | "valid" | "invalid";
/**
 * Event types that a field atom may validate against
 */
export type FieldAtomValidateOn =
  | "user"
  | "blur"
  | "change"
  | "touch"
  | "submit";

export type FieldAtom<Value> = Atom<{
  /**
   * An atom containing the field's name
   */
  name: WritableAtom<string | undefined, string | undefined | typeof RESET>;
  /**
   * An atom containing the field's value
   */
  value: WritableAtom<Value, Value | typeof RESET | ((prev: Value) => Value)>;
  /**
   * An atom containing the field's touched status
   */
  touched: WritableAtom<
    boolean,
    boolean | typeof RESET | ((prev: boolean) => boolean)
  >;
  /**
   * An atom containing the field's dirty status
   */
  dirty: Atom<boolean>;
  /**
   * A write-only atom for validating the field's value
   */
  validate: WritableAtom<null, void | FieldAtomValidateOn>;
  /**
   * An atom containing the field's validation status
   */
  validateStatus: WritableAtom<FormAtomValidateStatus, FormAtomValidateStatus>;
  /**
   * An atom containing the field's validation errors
   */
  errors: WritableAtom<string[], string[] | ((value: string[]) => string[])>;
  /**
   * A write-only atom for resetting the field atoms to their
   * initial states.
   */
  reset: WritableAtom<null, void>;
  /**
   * An atom containing a reference to the `HTMLElement` the field
   * is bound to.
   */
  ref: WritableAtom<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null,
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null
    | ((
        value: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
      ) => HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)
  >;
  _validateCount: WritableAtom<number, number | ((current: number) => number)>;
  _validateCallback?: FieldAtomConfig<Value>["validate"];
}>;

export type FormAtom<Fields extends FormAtomFields> = Atom<{
  /**
   * An atom containing an object of nested field atoms
   */
  fields: WritableAtom<
    Fields,
    Fields | typeof RESET | ((prev: Fields) => Fields),
    void
  >;
  /**
   * An read-only atom that derives the form's values from
   * its nested field atoms.
   */
  values: Atom<FormAtomValues<Fields>>;
  /**
   * An read-only atom that derives the form's errors from
   * its nested field atoms.
   */
  errors: Atom<FormAtomErrors<Fields>>;
  /**
   * A write-only atom that resets the form's nested field atoms
   */
  reset: WritableAtom<null, void>;
  /**
   * A write-only atom that validates the form's nested field atoms
   */
  validate: WritableAtom<null, void | FieldAtomValidateOn>;
  /**
   * A read-only atom that derives the form's validation status
   */
  validateStatus: Atom<FormAtomValidateStatus>;
  /**
   * A write-only atom for submitting the form
   */
  submit: WritableAtom<
    null,
    (values: FormAtomValues<Fields>) => void | Promise<void>
  >;
  /**
   * A read-only atom that reads the number of times the form has
   * been submitted
   */
  submitCount: Atom<number>;
  /**
   * An atom that contains the form's submission status
   */
  submitStatus: WritableAtom<FormAtomSubmitStatus, FormAtomSubmitStatus>;
}>;

/**
 * An object containing nested field atoms
 */
export type FormAtomFields = {
  [key: string | number]:
    | FieldAtom<any>
    | FormAtomFields
    | FormAtomFields[]
    | FieldAtom<any>[];
};

/**
 * An object containing the values of a form's nested field atoms
 */
export type FormAtomValues<Fields extends FormAtomFields> = {
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<infer Value>
    ? Value
    : Fields[Key] extends FormAtomFields
    ? FormAtomValues<Fields[Key]>
    : Fields[Key] extends any[]
    ? FormAtomValues<{
        [Index in keyof Fields[Key]]: Fields[Key][Index];
      }>
    : never;
};

/**
 * An object containing the errors of a form's nested field atoms
 */
export type FormAtomErrors<Fields extends FormAtomFields> = {
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<any>
    ? string[]
    : Fields[Key] extends FormAtomFields
    ? FormAtomErrors<Fields[Key]>
    : Fields[Key] extends any[]
    ? FormAtomErrors<{
        [Index in keyof Fields[Key]]: Fields[Key][Index];
      }>
    : never;
};

export interface UseFormAtom<Fields extends FormAtomFields> {
  /**
   * An object containing the values of a form's nested field atoms
   */
  fieldAtoms: Fields;
  /**
   * A function for handling form submissions.
   *
   * @param handleSubmit - A function that is called with the form's values
   *   when the form is submitted
   */
  submit(
    handleSubmit: (
      values: Parameters<
        ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["submit"]>
      >[0]
    ) => void | Promise<void>
  ): (e?: React.FormEvent<HTMLFormElement>) => void;
  /**
   * A function that validates the form's nested field atoms with a
   * `"user"` validation event.
   */
  validate(): void;
  /**
   * A function that resets the form's nested field atoms to their
   * initial states.
   */
  reset(): void;
}

export interface FormAtomStatus {
  /**
   * The validation status of the form
   */
  validateStatus: FormAtomValidateStatus;
  /**
   * The submission status of the form
   */
  submitStatus: FormAtomSubmitStatus;
}

export interface FormAtomState<Fields extends FormAtomFields> {
  /**
   * An object containing the form's nested field atoms
   */
  fieldAtoms: Fields;
  /**
   * An object containing the values of a form's nested field atoms
   */
  values: ExtractAtomValue<ExtractAtomValue<FormAtom<Fields>>["values"]>;
  /**
   * An object containing the errors of a form's nested field atoms
   */
  errors: ExtractAtomValue<ExtractAtomValue<FormAtom<Fields>>["errors"]>;
  /**
   * The number of times a form has been submitted
   */
  submitCount: number;
  /**
   * The validation status of the form
   */
  validateStatus: FormAtomValidateStatus;
  /**
   * The submission status of the form
   */
  submitStatus: FormAtomSubmitStatus;
}

export interface FormAtomActions<Fields extends FormAtomFields> {
  /**
   * A function for adding/removing fields from the form.
   *
   * @param fields - An object containing the form's nested field atoms or
   *   a callback that receives the current fields and returns the next
   *   fields.
   */
  updateFields(
    fields: ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["fields"]>
  ): void;
  /**
   * A function for handling form submissions.
   *
   * @param handleSubmit - A function that is called with the form's values
   *   when the form is submitted
   */
  submit(
    handleSubmit: (
      values: Parameters<
        ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["submit"]>
      >[0]
    ) => void | Promise<void>
  ): (e?: React.FormEvent<HTMLFormElement>) => void;
  /**
   * A function that validates the form's nested field atoms with a
   * `"user"` validation event.
   */
  validate(): void;
  /**
   * A function that resets the form's nested field atoms to their
   * initial states.
   */
  reset(): void;
}

export interface UseFieldAtom<Value> {
  /**
   * `<input>`, `<select>`, or `<textarea>` props for the field
   */
  props: FieldAtomProps<Value>;
  /**
   * Actions for managing the state of the field
   */
  actions: FieldAtomActions<Value>;
  /**
   * The current state of the field
   */
  state: FieldAtomState<Value>;
}

export interface FieldAtomProps<Value> {
  /**
   * The name of the field if there is one
   */
  name: string | undefined;
  /**
   * The value of the field
   */
  value: Value;
  /**
   * A WAI-ARIA property that tells a screen reader whether the
   * field is invalid
   */
  "aria-invalid": boolean;
  /**
   * A React callback ref that is used to bind the field atom to
   * an `<input>`, `<select>`, or `<textarea>` element so that it
   * can be read and focused.
   */
  ref: React.RefCallback<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  onBlur(event: React.FormEvent<HTMLInputElement>): void;
  onBlur(event: React.FormEvent<HTMLTextAreaElement>): void;
  onBlur(event: React.FormEvent<HTMLSelectElement>): void;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
  onChange(event: React.ChangeEvent<HTMLTextAreaElement>): void;
  onChange(event: React.ChangeEvent<HTMLSelectElement>): void;
}

export interface FieldAtomActions<Value> {
  /**
   * A function that validates the field's value with a `"user"` validation
   * event.
   */
  validate(): void;
  /**
   * A function for changing the value of a field. This will trigger a `"change"`
   * validation event.
   *
   * @param {Value} value - The new value of the field
   */
  setValue(
    value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["value"]>
  ): void;
  /**
   * A function for changing the touched state of a field. This will trigger a
   * `"touch"` validation event.
   *
   * @param {boolean} touched - The new touched state of the field
   */
  setTouched(
    touched: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["touched"]>
  ): void;
  /**
   * A function for changing the error state of a field
   *
   * @param {string[]} errors - The new error state of the field
   */
  setErrors(
    errors: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["errors"]>
  ): void;
  /**
   * Focuses the field atom's `<input>`, `<select>`, or `<textarea>` element
   * if there is one bound to it.
   */
  focus(): void;
  /**
   * Resets the field atom to its initial state.
   */
  reset(): void;
}

export interface FieldAtomState<Value> {
  /**
   * The value of the field
   */
  value: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["value"]>;
  /**
   * The touched state of the field
   */
  touched: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["touched"]>;
  /**
   * The dirty state of the field. A field is "dirty" if it's value has
   * been changed.
   */
  dirty: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["dirty"]>;
  /**
   * The validation status of the field
   */
  validateStatus: ExtractAtomValue<
    ExtractAtomValue<FieldAtom<Value>>["validateStatus"]
  >;
  /**
   * The error state of the field
   */
  errors: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["errors"]>;
}

export interface FieldAtomConfig<Value> {
  /**
   * Optionally provide a name for the field that will be added
   * to any attached `<input>`, `<select>`, or `<textarea>` elements
   */
  name?: string;
  /**
   * The initial value of the field
   */
  value: Value;
  /**
   * The initial touched state of the field
   */
  touched?: boolean;
  /**
   * A function that validates the value of the field any time
   * one of its atoms changes. It must either return an array of
   * string error messages or undefined. If it returns undefined,
   * the field is considered valid.
   */
  validate?: (state: {
    /**
     * A Jotai getter that can read other atoms
     */
    get: Getter;
    /**
     * The current value of the field
     */
    value: Value;
    /**
     * The dirty state of the field
     */
    dirty: boolean;
    /**
     * The touched state of the field
     */
    touched: boolean;
    /**
     * The event that caused the validation. Either:
     *
     * - `"change"` - The value of the field has changed
     * - `"touch"` - The field has been touched
     * - `"blur"` - The field has been blurred
     * - `"submit"` - The form has been submitted
     * - `"user"` - A user/developer has triggered the validation
     */
    event: FieldAtomValidateOn;
  }) => void | string[] | Promise<void | string[]>;
}

/**
 * A `Provider` or `useAtom` hook accepts an optional prop scope which you
 * can use for scoped Provider. When using atoms with a scope, the provider
 * with the same scope will be used. The recommendation for the scope value
 * is a unique symbol. The primary use case of scope is for library usage.
 */
export type Scope = symbol | string | number;
