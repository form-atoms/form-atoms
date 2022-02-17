import type {
  Atom,
  ExtractAtomUpdate,
  ExtractAtomValue,
  Getter,
  WritableAtom,
} from "jotai";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithReset, RESET } from "jotai/utils";
import * as React from "react";

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

  const validateResultAtom = atom<ValidationStatus>("idle");
  const validateAtom = atom<undefined, ValidateOn>(
    () => undefined,
    (get, set, event) => {
      if (get(validateResultAtom) === "validating") return;

      async function resolveErrors() {
        set(validateResultAtom, "validating");
        let valid = true;

        for (const field of Object.values(fields)) {
          const fieldAtom = get(field);
          const value = get(fieldAtom.value);
          const dirty = get(fieldAtom.dirty);
          const touched = get(fieldAtom.touched);
          const errors = await fieldAtom._validate?.({
            get,
            value,
            dirty,
            touched,
            event,
          });

          set(fieldAtom.errors, errors ?? get(fieldAtom.errors));

          if (errors && errors.length) {
            valid = false;
          }
        }

        set(validateResultAtom, valid ? "valid" : "invalid");
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

  const submitResultAtom = atom<FormSubmitStatus>("idle");
  const submitAtom = atom<
    undefined,
    (values: ExtractAtomValue<typeof valuesAtom>) => void | Promise<void>
  >(undefined, (get, set, onSubmit) => {
    if (get(submitResultAtom) === "submitting") return;

    async function resolveErrors() {
      set(submitResultAtom, "submitting");
      let valid = true;

      for (const field of Object.values(fields)) {
        const fieldAtom = get(field);
        const value = get(fieldAtom.value);
        const dirty = get(fieldAtom.dirty);
        const touched = get(fieldAtom.touched);
        const errors = await fieldAtom._validate?.({
          get,
          value,
          dirty,
          touched,
          event: "submit",
        });

        set(fieldAtom.errors, errors ?? get(fieldAtom.errors));

        if (errors && errors.length) {
          valid = false;
        }
      }

      if (!valid) {
        set(validateResultAtom, "invalid");
        return set(submitResultAtom, "idle");
      }

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
      set(validateResultAtom, "idle");
      set(submitResultAtom, "idle");
    }
  });

  return atom({
    fields: fieldsAtom,
    values: valuesAtom,
    errors: errorsAtom,
    submit: submitAtom,
    validate: validateAtom,
    reset: resetAtom,
  });
}

export type FormSubmitStatus = "idle" | "submitting" | "submitted";
export type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

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
  validate: WritableAtom<undefined, ValidateOn>;
  submit: WritableAtom<
    undefined,
    (values: Record<keyof Fields, Fields[keyof Fields]>) => void | Promise<void>
  >;
}>;

export function useFormAtom<Fields extends Record<string, FieldAtom<any>>>(
  atom: FormAtom<Fields>
) {
  const form = useAtomValue(atom);
  const [fieldAtoms, updateFields] = useAtom(form.fields);
  const reset = useSetAtom(form.reset);
  const validate = useSetAtom(form.validate);

  return React.useMemo(
    () => ({
      fieldAtoms,
      addField<FieldName extends keyof Fields>(
        fieldName: FieldName,
        atom: Fields[FieldName]
      ) {
        updateFields((current) => ({ ...current, [fieldName]: atom }));
      },
      removeField<FieldName extends keyof Fields>(fieldName: FieldName) {
        updateFields((current) => {
          const next = { ...current };
          delete next[fieldName];
          return next;
        });
      },
      validate,
      reset,
    }),
    [fieldAtoms, validate, reset, updateFields]
  );
}

export function useFormErrors<Fields extends Record<string, FieldAtom<any>>>(
  atom: FormAtom<Fields>
) {
  const form = useAtomValue(atom);
  return useAtomValue(form.errors);
}

export function useFormValues<Fields extends Record<string, FieldAtom<any>>>(
  atom: FormAtom<Fields>
) {
  const form = useAtomValue(atom);
  return useAtomValue(form.values);
}

export function useSubmitForm<Fields extends Record<string, FieldAtom<any>>>(
  atom: FormAtom<Fields>
) {
  const form = useAtomValue(atom);
  return useSetAtom(form.submit);
}

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
  const validateAtom = atom<undefined, ValidateOn>(
    undefined,
    (get, set, event) => {
      async function resolveErrors() {
        const dirty = get(dirtyAtom);
        const touched = get(touchedAtom);
        const value = get(valueAtom);

        set(
          errorsAtom,
          (await config.validate?.({ get, dirty, touched, value, event })) ??
            get(errorsAtom)
        );
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
    errors: errorsAtom,
    ref: refAtom,
    _validate: config.validate,
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
  validate: WritableAtom<undefined, ValidateOn>;
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
  _validate?: FieldAtomConfig<Value>["validate"];
}>;

export type ValidateOn = "blur" | "change" | "touch" | "submit";

export function useFieldAtom<Value>(
  atom: FieldAtom<Value>,
  scope?: Scope
): UseFieldAtom<Value> {
  const props = useFieldAtomProps(atom, scope);
  const actions = useFieldAtomActions(atom, scope);
  const state = useFieldAtomState(atom, scope);
  return React.useMemo(
    () => ({ props, actions, state }),
    [props, actions, state]
  );
}

export interface UseFieldAtom<Value> {
  props: FieldAtomProps<Value>;
  actions: FieldAtomActions<Value>;
  state: FieldAtomState<Value>;
}

export function useFieldAtomActions<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomActions<Value> {
  const atoms = useAtomValue(fieldAtom, scope);
  const setValue = useSetAtom(atoms.value, scope);
  const setTouched = useSetAtom(atoms.touched, scope);
  const validate = useSetAtom(atoms.validate, scope);
  const ref = useAtomValue(atoms.ref, scope);

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
        focus() {
          ref?.focus();
        },
        reset() {
          setValue(RESET);
          setTouched(RESET);
          validate("change");
        },
      } as const),
    [setValue, setTouched, ref, validate]
  );
}

export function useFieldAtomProps<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomProps<Value> {
  const atoms = useAtomValue(fieldAtom, scope);
  const name = useAtomValue(atoms.name, scope);
  const [value, setValue] = useAtom(atoms.value, scope);
  const setTouched = useSetAtom(atoms.touched, scope);
  const errors = useSetAtom(atoms.errors, scope);
  const validate = useSetAtom(atoms.validate, scope);
  const ref = useSetAtom(atoms.ref, scope);

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
  const atoms = useAtomValue(fieldAtom, scope);
  const value = useAtomValue(atoms.value, scope);
  const touched = useAtomValue(atoms.touched, scope);
  const dirty = useAtomValue(atoms.dirty, scope);
  const errors = useAtomValue(atoms.errors, scope);

  return React.useMemo(
    () =>
      ({
        value: value as unknown as Value,
        touched,
        dirty,
        errors,
      } as const),
    [value, touched, dirty, errors]
  );
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
    value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["validate"]>
  ): void;
  setValue(
    value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["value"]>
  ): void;
  setTouched(
    value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["touched"]>
  ): void;
  focus(): void;
  reset(): void;
}

export interface FieldAtomState<Value> {
  value: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["value"]>;
  touched: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["touched"]>;
  dirty: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["dirty"]>;
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
    event: ValidateOn;
  }) => void | string[] | Promise<void | string[]>;
}

export type Scope = symbol | string | number;
