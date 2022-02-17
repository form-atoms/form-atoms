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

//
// Forms
//

export function formAtom<Fields extends Record<string, FieldAtom<any>>>(
  fields: Fields
): FormAtom<Fields> {
  const fieldsAtom = atomWithReset(fields);

  const valuesAtom = atom((get) => {
    const values = {} as Record<
      keyof Fields,
      ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
    >;

    for (const key in fields) {
      const fieldAtom = get(fields[key]);
      values[key] = get(fieldAtom.value);
    }

    return values;
  });

  async function validateField(
    get: Getter,
    set: Setter,
    event: FieldAtomValidateOn,
    field: FieldAtom<any>
  ) {
    const fieldAtom = get(field);
    set(fieldAtom.validateStatus, "validating");
    const value = get(fieldAtom.value);
    const dirty = get(fieldAtom.dirty);

    if (event === "user" || event === "submit") {
      set(fieldAtom.touched, true);
    }

    const errors = await fieldAtom._validateCallback?.({
      get,
      value,
      dirty,
      touched: get(fieldAtom.touched),
      event,
    });

    set(fieldAtom.errors, errors ?? []);

    if (errors && errors.length) {
      set(fieldAtom.validateStatus, "invalid");
      return false;
    }

    set(fieldAtom.validateStatus, "valid");
    return true;
  }

  const validateResultAtom = atom<FormAtomValidateStatus>("idle");
  const validateAtom = atom<undefined, FieldAtomValidateOn>(
    () => undefined,
    (get, set, event = "user") => {
      if (get(validateResultAtom) === "validating") return;

      async function resolveErrors() {
        set(validateResultAtom, "validating");

        const fieldsAreValid = await Promise.all(
          Object.values(fields).map((field) =>
            validateField(get, set, event, field)
          )
        );

        set(
          validateResultAtom,
          fieldsAreValid.every((value) => value) ? "valid" : "invalid"
        );
      }

      resolveErrors();
    }
  );

  const errorsAtom = atom((get) => {
    const errors = {} as Record<keyof Fields, string[]>;

    for (const key in fields) {
      const fieldAtom = get(fields[key]);
      errors[key] = get(fieldAtom.errors);
    }

    return errors;
  });

  const submitResultAtom = atom<FormAtomSubmitStatus>("idle");
  const submitAtom = atom<
    undefined,
    (
      values: Record<
        keyof Fields,
        ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
      >
    ) => void | Promise<void>
  >(undefined, (get, set, onSubmit) => {
    if (get(submitResultAtom) === "submitting") return;

    async function resolveErrors() {
      set(submitResultAtom, "submitting");
      set(validateResultAtom, "validating");

      const fieldsAreValid = await Promise.all(
        Object.values(fields).map((field) =>
          validateField(get, set, "submit", field)
        )
      );

      set(
        validateResultAtom,
        fieldsAreValid.every((value) => value) ? "valid" : "invalid"
      );

      try {
        await Promise.resolve(onSubmit(get(valuesAtom)));
      } catch (err) {
        set(submitResultAtom, "submitted");
      } finally {
        set(submitResultAtom, "submitted");
      }
    }

    resolveErrors();
  });

  const resetAtom = atom(undefined, (get, set) => {
    for (const key in fields) {
      const fieldAtom = get(fields[key]);
      set(fieldAtom.value, RESET);
      set(fieldAtom.touched, RESET);
      set(fieldAtom.errors, []);
      set(fieldAtom.validateStatus, "idle");
      set(validateResultAtom, "idle");
      set(submitResultAtom, "idle");
    }
  });

  return atom({
    fields: fieldsAtom,
    values: valuesAtom,
    errors: errorsAtom,
    validate: validateAtom,
    validateStatus: validateResultAtom,
    submit: submitAtom,
    submitStatus: submitResultAtom,
    reset: resetAtom,
  });
}

export function useFormAtom<Fields extends Record<string, FieldAtom<any>>>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): UseFormAtom<Fields> {
  const form = useAtomValue(formAtom, scope);
  const fieldAtoms = useAtomValue(form.fields, scope);
  const reset = useSetAtom(form.reset, scope);
  const validate = useSetAtom(form.validate, scope);
  const handleSubmit = useSetAtom(form.submit, scope);
  const submitStatus = useAtomValue(form.submitStatus, scope);
  const validateStatus = useAtomValue(form.validateStatus, scope);

  return React.useMemo(
    () => ({
      fieldAtoms: fieldAtoms as Fields,
      validate,
      reset,
      submit(onSubmit) {
        return (e) => {
          e?.preventDefault();
          return handleSubmit(onSubmit);
        };
      },
      submitStatus,
      validateStatus,
    }),
    [fieldAtoms, validate, reset, submitStatus, validateStatus, handleSubmit]
  );
}

export function useFormAtomState<Fields extends Record<string, FieldAtom<any>>>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomState<Fields> {
  const form = useAtomValue(formAtom, scope);
  const fieldAtoms = useAtomValue(form.fields, scope);
  const submitStatus = useAtomValue(form.submitStatus, scope);
  const validateStatus = useAtomValue(form.validateStatus, scope);
  const values = useAtomValue(form.values, scope);
  const errors = useAtomValue(form.errors, scope);

  return React.useMemo(
    () => ({
      fieldAtoms: fieldAtoms as Fields,
      values: values as any,
      errors: errors as any,
      submitStatus,
      validateStatus,
    }),
    [fieldAtoms, values, errors, submitStatus, validateStatus]
  );
}

export function useFormAtomActions<
  Fields extends Record<string, FieldAtom<any>>
>(formAtom: FormAtom<Fields>, scope?: Scope): FormAtomActions<Fields> {
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
      validate,
      submit,
    }),
    [updateFields, reset, validate, submit]
  );
}

export function useFormAtomErrors<
  Fields extends Record<string, FieldAtom<any>>
>(formAtom: FormAtom<Fields>, scope?: Scope) {
  const form = useAtomValue(formAtom, scope);
  return useAtomValue(form.errors, scope);
}

export function useFormAtomValues<
  Fields extends Record<string, FieldAtom<any>>
>(formAtom: FormAtom<Fields>, scope?: Scope) {
  const form = useAtomValue(formAtom, scope);
  return useAtomValue(form.values, scope);
}

export function useFormAtomSubmit<
  Fields extends Record<string, FieldAtom<any>>
>(formAtom: FormAtom<Fields>, scope?: Scope) {
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
  const validateResultAtom = atom<FormAtomValidateStatus>("idle");
  const validateAtom = atom<undefined, FieldAtomValidateOn>(
    undefined,
    (get, set, event = "user") => {
      async function resolveErrors() {
        set(validateResultAtom, "validating");
        const dirty = get(dirtyAtom);
        const value = get(valueAtom);

        if (event === "user" || event === "submit") {
          set(touchedAtom, true);
        }

        const errors =
          (await config.validate?.({
            get,
            dirty,
            touched: get(touchedAtom),
            value,
            event,
          })) ?? [];

        set(errorsAtom, errors);
        set(validateResultAtom, errors.length > 0 ? "invalid" : "valid");
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
  } as const);
}

export type FieldAtom<Value> = Atom<{
  name: Atom<string>;
  value: WritableAtom<Value, Value | typeof RESET | ((prev: Value) => Value)>;
  touched: WritableAtom<
    boolean,
    boolean | typeof RESET | ((prev: boolean) => boolean)
  >;
  dirty: Atom<boolean>;
  validate: WritableAtom<undefined, FieldAtomValidateOn>;
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
  _validateCallback?: FieldAtomConfig<Value>["validate"];
}>;

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
  const ref = useAtomValue(field.ref, scope);

  return React.useMemo(
    () =>
      ({
        validate,
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
          setValidateStatus("idle");
        },
      } as const),
    [validate, setErrors, setValue, setTouched, ref, setValidateStatus]
  );
}

export function useFieldAtomProps<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomProps<Value> {
  const field = useAtomValue(fieldAtom, scope);
  const name = useAtomValue(field.name, scope);
  const [value, setValue] = useAtom(field.value, scope);
  const setTouched = useSetAtom(field.touched, scope);
  const errors = useSetAtom(field.errors, scope);
  const validate = useSetAtom(field.validate, scope);
  const ref = useSetAtom(field.ref, scope);

  return React.useMemo(
    () => ({
      name,
      value: value as Value,
      "aria-invalid": !!(errors && errors.length > 0),
      ref,
      onBlur() {
        setTouched(true);
        validate("blur");
      },
      onChange(event) {
        // @ts-expect-error: `onChange` always updates with a string but
        //  the value type is arbitrary
        setValue(event.target.value);
        validate("change");
      },
    }),
    [name, value, errors, ref, setTouched, validate, setValue]
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

export function useFieldAtom<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): UseFieldAtom<Value> {
  const props = useFieldAtomProps(fieldAtom, scope);
  const actions = useFieldAtomActions(fieldAtom, scope);
  const state = useFieldAtomState(fieldAtom, scope);
  return React.useMemo(
    () => ({ props, actions, state }),
    [props, actions, state]
  );
}

export type FormAtomSubmitStatus = "idle" | "submitting" | "submitted";
export type FormAtomValidateStatus =
  | "idle"
  | "validating"
  | "valid"
  | "invalid";
export type FieldAtomValidateOn =
  | "user"
  | "blur"
  | "change"
  | "touch"
  | "submit";

export type FormAtom<Fields extends Record<string, FieldAtom<any>>> = Atom<{
  fields: WritableAtom<
    Fields,
    Fields | typeof RESET | ((prev: Fields) => Fields),
    void
  >;
  values: Atom<
    Record<
      keyof Fields,
      ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
    >
  >;
  errors: Atom<Record<keyof Fields, string[]>>;
  reset: WritableAtom<undefined, undefined>;
  validate: WritableAtom<undefined, FieldAtomValidateOn>;
  validateStatus: WritableAtom<FormAtomValidateStatus, FormAtomValidateStatus>;
  submit: WritableAtom<
    undefined,
    (
      values: Record<
        keyof Fields,
        ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
      >
    ) => void | Promise<void>
  >;
  submitStatus: WritableAtom<FormAtomSubmitStatus, FormAtomSubmitStatus>;
}>;

interface UseFormAtom<Fields extends Record<string, FieldAtom<any>>> {
  fieldAtoms: Fields;
  submit(
    handleSubmit: (
      values: Parameters<
        ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["submit"]>
      >[0]
    ) => void | Promise<void>
  ): (e?: React.FormEvent<HTMLFormElement>) => void;
  validate(update?: FieldAtomValidateOn): void;
  reset(update?: undefined): void;
  validateStatus: FormAtomValidateStatus;
  submitStatus: FormAtomSubmitStatus;
}

export { Provider } from "jotai";

interface FormAtomState<Fields extends Record<string, FieldAtom<any>>> {
  fieldAtoms: Fields;
  values: ExtractAtomValue<ExtractAtomValue<FormAtom<Fields>>["values"]>;
  errors: ExtractAtomValue<ExtractAtomValue<FormAtom<Fields>>["errors"]>;
  validateStatus: FormAtomValidateStatus;
  submitStatus: FormAtomSubmitStatus;
}

interface FormAtomActions<Fields extends Record<string, FieldAtom<any>>> {
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
  validate(update: FieldAtomValidateOn): void;
  reset(update?: undefined): void;
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
  validate(
    value?: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["validate"]>
  ): void;
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
