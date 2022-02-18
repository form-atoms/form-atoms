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
import set from "lodash.set";
import * as React from "react";

//
// Forms
//

export function formAtom<Fields extends FormAtomFields>(
  fields: Fields
): FormAtom<Fields> {
  const fieldsAtom = atomWithReset(fields);

  const valuesAtom = atom((get) => {
    const values = {} as FormAtomValues<Fields>;

    walkFields(fields, (field, path) => {
      const fieldAtom = get(field);
      set(values, path, get(fieldAtom.value));
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
          const err = errors ?? [];
          set(fieldAtom.errors, err);
          set(fieldAtom.validateStatus, err.length > 0 ? "invalid" : "valid");
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
      validateFields(get, set, event!);
    }
  );

  const errorsAtom = atom((get) => {
    const errors = {} as FormAtomErrors<Fields>;

    walkFields(fields, (field, path) => {
      const fieldAtom = get(field);
      set(errors, path, get(fieldAtom.errors));
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
      set(submitResultAtom, "submitting");
      // This pointer prevents a stale validation result from being
      // set after the most recent validation has been performed.
      const ptr = get(submitStatusCountAtom) + 1;
      set(submitStatusCountAtom, ptr);
      set(submitCountAtom, (count) => ++count);
      await validateFields(get, set, "submit");

      try {
        await Promise.resolve(onSubmit(get(valuesAtom)));
        // eslint-disable-next-line no-empty
      } catch (err) {
      } finally {
        get(submitStatusCountAtom) === ptr &&
          set(submitResultAtom, "submitted");
      }
    }

    resolveSubmit();
  });

  const resetAtom = atom(null, (get, set) => {
    walkFields(fields, (field) => {
      const fieldAtom = get(field);
      set(fieldAtom.value, RESET);
      set(fieldAtom.touched, RESET);
      set(fieldAtom.errors, []);
      // Need to set a new validateCount to prevent stale validation results
      // from being set after this invocation.
      set(fieldAtom._validateCount, (current) => ++current);
      set(fieldAtom.validateStatus, "valid");
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
        startTransition(() => validate("user"));
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
      addField(fieldName, atom) {
        updateFields((current) => ({ ...current, [fieldName]: atom }));
      },
      removeField<FieldName extends keyof Fields>(fieldName: FieldName) {
        updateFields((current) => {
          const next = { ...current };
          delete next[fieldName];
          return next;
        });
      },
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

export function useFormAtomErrors<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
) {
  const form = useAtomValue(formAtom, scope);
  return useAtomValue(form.errors, scope);
}

export function useFormAtomValues<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
) {
  const form = useAtomValue(formAtom, scope);
  return useAtomValue(form.values, scope);
}

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

export function fieldAtom<Value>(
  config: FieldAtomConfig<Value>
): FieldAtom<Value> {
  const nameAtom = atom(() => config.name);
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
          event: event!,
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

  return atom({
    name: nameAtom,
    value: valueAtom,
    touched: touchedAtom,
    dirty: dirtyAtom,
    validate: validateAtom,
    validateStatus: validateResultAtom,
    errors: errorsAtom,
    ref: refAtom,
    _validateCallback: config.validate,
    _validateCount: validateCountAtom,
  } as const);
}

export function useFieldAtomActions<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomActions<Value> {
  const field = useAtomValue(fieldAtom, scope);
  const setValue = useSetAtom(field.value, scope);
  const setTouched = useSetAtom(field.touched, scope);
  const setErrors = useSetAtom(field.errors, scope);
  const validate = useSetAtom(field.validate, scope);
  const setValidateStatus = useSetAtom(field.validateStatus, scope);
  const setValidateCount = useSetAtom(field._validateCount, scope);
  const ref = useAtomValue(field.ref, scope);
  const [, startTransition] = useTransition();

  return React.useMemo(
    () =>
      ({
        validate() {
          startTransition(() => {
            validate("user");
          });
        },
        setValue(value) {
          setValue(value);
          validate("change");
        },
        setTouched(touched) {
          setTouched(touched);
          validate("touch");
        },
        setErrors,
        focus() {
          ref?.focus();
        },
        reset() {
          setErrors([]);
          setTouched(RESET);
          setValue(RESET);
          // Need to set a new pointer to prevent stale validation results
          // from being set to state after this invocation.
          setValidateCount((count) => ++count);
          setValidateStatus("valid");
        },
      } as const),
    [
      validate,
      setErrors,
      setValue,
      setTouched,
      ref,
      setValidateCount,
      setValidateStatus,
    ]
  );
}

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

  return React.useMemo(
    () => ({
      name,
      value: value as Value,
      "aria-invalid": validateStatus === "invalid",
      ref,
      onBlur() {
        setTouched(true);
        validate("blur");
      },
      onChange(event) {
        setValue(event.target.value);
        validate("change");
      },
    }),
    [name, value, validateStatus, ref, setTouched, validate, setValue]
  );
}

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
    () =>
      ({
        value: value as unknown as Value,
        touched,
        dirty,
        validateStatus,
        errors,
      } as const),
    [value, touched, dirty, validateStatus, errors]
  );
}

export function useFieldAtomValue<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
) {
  const field = useAtomValue(fieldAtom, scope);
  return useAtomValue(field.value, scope);
}

export function useFieldAtomErrors<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
) {
  const field = useAtomValue(fieldAtom, scope);
  return useAtomValue(field.errors, scope);
}

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

function walkFields<Fields extends FormAtomFields>(
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

export type FormAtomSubmitStatus = "idle" | "submitting" | "submitted";
export type FormAtomValidateStatus = "validating" | "valid" | "invalid";
export type FieldAtomValidateOn =
  | "user"
  | "blur"
  | "change"
  | "touch"
  | "submit";

export type FieldAtom<Value> = Atom<{
  name: Atom<string>;
  value: WritableAtom<Value, Value | typeof RESET | ((prev: Value) => Value)>;
  touched: WritableAtom<
    boolean,
    boolean | typeof RESET | ((prev: boolean) => boolean)
  >;
  dirty: Atom<boolean>;
  validate: WritableAtom<null, void | FieldAtomValidateOn>;
  validateStatus: WritableAtom<FormAtomValidateStatus, FormAtomValidateStatus>;
  errors: WritableAtom<string[], string[] | ((value: string[]) => string[])>;
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
  fields: WritableAtom<
    Fields,
    Fields | typeof RESET | ((prev: Fields) => Fields),
    void
  >;
  values: Atom<FormAtomValues<Fields>>;
  errors: Atom<FormAtomErrors<Fields>>;
  reset: WritableAtom<null, void>;
  validate: WritableAtom<null, void | FieldAtomValidateOn>;
  validateStatus: Atom<FormAtomValidateStatus>;
  submit: WritableAtom<
    null,
    (values: FormAtomValues<Fields>) => void | Promise<void>
  >;
  submitCount: Atom<number>;
  submitStatus: WritableAtom<FormAtomSubmitStatus, FormAtomSubmitStatus>;
}>;

export type FormAtomFields = {
  [key: string | number]:
    | FieldAtom<any>
    | FormAtomFields
    | FormAtomFields[]
    | FieldAtom<any>[];
};

export type FormAtomValues<Fields extends FormAtomFields> = {
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<infer Value>
    ? Value
    : // @ts-expect-error: not sure yet
      FormAtomValues<Fields[Key]>;
};

export type FormAtomErrors<Fields extends FormAtomFields> = {
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<any>
    ? string[]
    : // @ts-expect-error: not sure yet
      FormAtomValues<Fields[Key]>;
};

interface UseFormAtom<Fields extends FormAtomFields> {
  fieldAtoms: Fields;
  submit(
    handleSubmit: (
      values: Parameters<
        ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["submit"]>
      >[0]
    ) => void | Promise<void>
  ): (e?: React.FormEvent<HTMLFormElement>) => void;
  validate(): void;
  reset(): void;
}

interface FormAtomStatus {
  validateStatus: FormAtomValidateStatus;
  submitStatus: FormAtomSubmitStatus;
}

interface FormAtomState<Fields extends FormAtomFields> {
  fieldAtoms: Fields;
  values: ExtractAtomValue<ExtractAtomValue<FormAtom<Fields>>["values"]>;
  errors: ExtractAtomValue<ExtractAtomValue<FormAtom<Fields>>["errors"]>;
  submitCount: number;
  validateStatus: FormAtomValidateStatus;
  submitStatus: FormAtomSubmitStatus;
}

interface FormAtomActions<Fields extends FormAtomFields> {
  addField<FieldName extends keyof Fields>(
    name: FieldName,
    atom: Fields[FieldName]
  ): void;
  removeField<FieldName extends keyof Fields>(name: FieldName): void;
  submit(
    handleSubmit: (
      values: Parameters<
        ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["submit"]>
      >[0]
    ) => void | Promise<void>
  ): (e?: React.FormEvent<HTMLFormElement>) => void;
  validate(): void;
  reset(): void;
}

export interface UseFieldAtom<Value> {
  props: FieldAtomProps<Value>;
  actions: FieldAtomActions<Value>;
  state: FieldAtomState<Value>;
}

export interface FieldAtomProps<Value> {
  name: string;
  value: Value;
  "aria-invalid": boolean;
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
  validate(): void;
  setValue(
    value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["value"]>
  ): void;
  setTouched(
    value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["touched"]>
  ): void;
  setErrors(
    value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["errors"]>
  ): void;
  focus(): void;
  reset(): void;
}

export interface FieldAtomState<Value> {
  value: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["value"]>;
  touched: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["touched"]>;
  dirty: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["dirty"]>;
  validateStatus: ExtractAtomValue<
    ExtractAtomValue<FieldAtom<Value>>["validateStatus"]
  >;
  errors: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["errors"]>;
}

export interface FieldAtomConfig<Value> {
  name: string;
  value: Value;
  touched?: boolean;
  validate?: (state: {
    get: Getter;
    value: Value;
    dirty: boolean;
    touched: boolean;
    event: FieldAtomValidateOn;
  }) => void | string[] | Promise<void | string[]>;
}

export type Scope = symbol | string | number;
