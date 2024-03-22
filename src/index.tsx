import * as React from "react";

import type {
  Atom,
  ExtractAtomArgs,
  ExtractAtomValue,
  Getter,
  Setter,
  WritableAtom,
  createStore,
} from "jotai";
import {
  Provider,
  atom,
  useAtom,
  useAtomValue,
  useSetAtom,
  useStore,
} from "jotai";
import { RESET, atomWithReset, useHydrateAtoms } from "jotai/utils";

import { formatDateString, setPath } from "./utils";

export { Provider } from "jotai";

//
// Components
//

/**
 * A React component that renders form atoms and their fields in an isolated
 * scope using a Jotai Provider.
 *
 * @param {FormProps<Fields>} props - Component props
 */
export function Form<Fields extends FormFields>(props: FormProps<Fields>) {
  return (
    <Provider store={props.store}>
      <FormAtom {...props} />
    </Provider>
  );
}

function FormAtom<Fields extends FormFields>(
  props:
    | {
        atom: FormAtom<Fields>;
        render(props: UseForm<Fields>): JSX.Element;
      }
    | {
        atom: FormAtom<Fields>;
        component: React.ComponentType<UseForm<Fields>>;
      }
) {
  const form = useForm(props.atom);

  if ("render" in props) {
    return props.render(form);
  }

  return React.createElement(props.component, form);
}

/**
 * A React component that renders field atoms with initial values. This is
 * most useful for fields that are rendered as native HTML elements because
 * the props can unpack directly into the underlying component.
 *
 * @param {FieldProps<Value>} props - Component props
 */
export function InputField<
  Type extends React.HTMLInputTypeAttribute,
  Value extends InputFieldValueForType<Type> = InputFieldValueForType<Type>
>(props: InputFieldProps<Type, Value>) {
  const fieldAtom = useInputField(props.atom, props);
  return render(props, fieldAtom);
}

/**
 * A React component that renders field atoms with initial values. This is
 * most useful for fields that are rendered as native HTML elements because
 * the props can unpack directly into the underlying component.
 *
 * @param {FieldProps<Value>} props - Component props
 */
export function SelectField<
  Value extends string = string,
  Multiple extends Readonly<boolean> = false
>(props: SelectFieldProps<Value, Multiple>) {
  const fieldAtom = useSelectField(props.atom, props);
  return render(props, fieldAtom);
}

/**
 * A React component that renders field atoms with initial values. This is
 * most useful for fields that are rendered as native HTML elements because
 * the props can unpack directly into the underlying component.
 *
 * @param {FieldProps<Value>} props - Component props
 */
export function TextareaField<Value extends string>(
  props: TextareaFieldProps<Value>
) {
  const fieldAtom = useTextareaField(props.atom, props);
  return render(props, fieldAtom);
}

function render(
  props:
    | {
        render(
          props:
            | UseInputFieldProps<any>
            | UseTextareaFieldProps<any>
            | UseSelectFieldProps<any, any>,
          state: UseFieldState<any>,
          actions: UseFieldActions<any>
        ): JSX.Element;
      }
    | { component: string | React.ComponentType<any> },
  fieldAtom: { props: any; state: any; actions: any }
) {
  if ("render" in props) {
    return props.render(fieldAtom.props, fieldAtom.state, fieldAtom.actions);
  }

  return React.createElement(props.component, fieldAtom.props);
}

/**
 * A React component that renders field atoms with initial values. This is
 * most useful for fields that aren't rendered as native HTML elements.
 *
 * @param {FieldProps<Value>} props - Component props
 */
export function Field<Value>(props: FieldProps<Value>) {
  const { state, actions } = useField(props.atom, props);

  if ("render" in props) {
    return props.render(state, actions);
  }

  return React.createElement(props.component, { state, actions });
}

//
// Forms
//

/**
 * An atom that derives its state fields atoms and allows you to submit,
 * validate, and reset your form.
 *
 * @param {FormFields} fields - An object containing field atoms to
 *   be included in the form. Field atoms can be deeply nested in
 *   objects and arrays.
 * @returns The `formAtom` function returns a Jotai `Atom`
 *   comprised of other atoms for managing the state of the form.
 */
export function formAtom<Fields extends FormFields>(
  fields: Fields
): FormAtom<Fields> {
  const fieldsAtom = atomWithReset(fields);
  const valuesAtom = atom((get) => {
    const fields = get(fieldsAtom);
    const values = {} as FormFieldValues<Fields>;

    walkFields(
      fields,
      (field, path) => {
        if (field) {
          const fieldAtom = get(field);
          setPath(values, path, get(fieldAtom.value));
        } else {
          setPath(values, path, []);
        }
      },
      { includeEmptyArrays: true }
    );

    return values;
  });

  async function validateFields(get: Getter, set: Setter, event: ValidateOn) {
    const fields = get(fieldsAtom);
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
          set,
          value,
          dirty,
          touched: get(fieldAtom.touched),
          event,
        });

        let errors: string[];

        if (isPromise(maybePromise)) {
          set(fieldAtom.validateStatus, "validating");
          errors = (await maybePromise) ?? get(fieldAtom.errors);
        } else {
          errors = maybePromise ?? get(fieldAtom.errors);
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

  const validateStatusAtom = atom<ValidateStatus>((get) => {
    const fields = get(fieldsAtom);
    let status: ValidateStatus = "valid";

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

  const validateAtom = atom<null, [] | [ValidateOn], void>(
    null,
    (get, set, event = "user") => {
      event && validateFields(get, set, event);
    }
  );

  const errorsAtom = atom((get) => {
    const fields = get(fieldsAtom);
    const errors = {} as FormFieldErrors<Fields>;

    walkFields(fields, (field, path) => {
      const fieldAtom = get(field);
      setPath(errors, path, get(fieldAtom.errors));
    });

    return errors;
  });

  const submitCountAtom = atom(0);
  const submitStatusCountAtom = atom(0);
  const submitStatusAtom = atom<SubmitStatus>("idle");
  const submitAtom = atom<
    null,
    [(value: FormFieldValues<Fields>) => void | Promise<void>],
    void
  >(null, (get, set, onSubmit) => {
    async function resolveSubmit() {
      // This pointer prevents a stale validation result from being
      // set after the most recent validation has been performed.
      const ptr = get(submitStatusCountAtom) + 1;
      set(submitStatusCountAtom, ptr);
      set(submitCountAtom, (count) => ++count);
      await validateFields(get, set, "submit");
      const validateStatus = get(validateStatusAtom);

      if (validateStatus === "invalid") {
        return (
          ptr === get(submitStatusCountAtom) && set(submitStatusAtom, "idle")
        );
      }

      const submission = onSubmit(get(valuesAtom));

      try {
        if (isPromise(submission)) {
          ptr === get(submitStatusCountAtom) &&
            set(submitStatusAtom, "submitting");
          await submission;
        }
        // eslint-disable-next-line no-empty
      } catch (err) {
      } finally {
        if (ptr === get(submitStatusCountAtom)) {
          set(submitStatusAtom, "submitted");
        }
      }
    }

    resolveSubmit();
  });

  const dirtyAtom = atom((get) => {
    const fields = get(fieldsAtom);
    let dirty = false;

    walkFields(fields, (field) => {
      const fieldAtom = get(field);
      dirty = get(fieldAtom.dirty);
      if (dirty) return false;
    });

    return dirty;
  });

  const touchedFieldsAtom = atom((get) => {
    const fields = get(fieldsAtom);
    const touchedFields = {} as TouchedFields<Fields>;

    walkFields(fields, (field, path) => {
      const fieldAtom = get(field);
      setPath(touchedFields, path, get(fieldAtom.touched));
    });

    return touchedFields;
  });

  const resetAtom = atom(null, (get, set) => {
    set(fieldsAtom, RESET);
    walkFields(get(fieldsAtom), (field) => {
      const fieldAtom = get(field);
      set(fieldAtom.reset);
    });
    set(submitStatusCountAtom, (current) => ++current);
    set(submitStatusAtom, "idle");
  });

  const formAtoms = {
    fields: fieldsAtom,
    values: valuesAtom,
    errors: errorsAtom,
    dirty: dirtyAtom,
    touchedFields: touchedFieldsAtom,
    validate: validateAtom,
    validateStatus: validateStatusAtom,
    submit: submitAtom,
    submitStatus: submitStatusAtom,
    submitCount: submitCountAtom,
    reset: resetAtom,
    _validateFields: validateFields,
  };

  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    Object.entries(formAtoms).map(([atomName, atom]) => {
      if (isAtom(atom)) {
        atom.debugLabel = `form/${atomName}`;
      }
    });
  }

  return atom(formAtoms);
}

/**
 * A hook that returns an object that contains the `fieldAtoms` and actions to
 * validate, submit, and reset the form.
 *
 * @param {FormAtom<FormFields>} formAtom - The atom that stores the form state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns A set of functions that can be used to interact
 *   with the form.
 */
export function useForm<Fields extends FormFields>(
  formAtom: FormAtom<Fields>,
  options?: UseAtomOptions
): UseForm<Fields> {
  const form = useAtomValue(formAtom, options);
  const fieldAtoms = useAtomValue(form.fields, options);
  const reset = useSetAtom(form.reset, options);
  const validate = useSetAtom(form.validate, options);
  const handleSubmit = useSetAtom(form.submit, options);
  const [, startTransition] = useTransition();

  return React.useMemo(
    () => ({
      fieldAtoms: fieldAtoms as Fields,
      validate() {
        startTransition(() => {
          validate("user");
        });
      },
      reset(event) {
        event?.preventDefault();
        startTransition(() => {
          reset();
        });
      },
      submit(onSubmit) {
        return (event) => {
          event?.preventDefault();
          startTransition(() => {
            handleSubmit(onSubmit);
          });
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
 * `useFormStatus`.
 *
 * @param {FormAtom<FormFields>} formAtom - The atom that stores the form state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 */
export function useFormState<Fields extends FormFields>(
  formAtom: FormAtom<Fields>,
  options?: UseAtomOptions
): UseFormState<Fields> {
  const form = useAtomValue(formAtom, options);
  const fieldAtoms = useAtomValue(form.fields, options);
  const submitCount = useAtomValue(form.submitCount, options);
  const submitStatus = useAtomValue(form.submitStatus, options);
  const validateStatus = useAtomValue(form.validateStatus, options);
  const values = useAtomValue(form.values, options);
  const errors = useAtomValue(form.errors, options);
  const dirty = useAtomValue(form.dirty, options);
  const touchedFields = useAtomValue(form.touchedFields, options);

  return React.useMemo(
    () => ({
      fieldAtoms,
      values,
      errors,
      dirty,
      touchedFields,
      submitCount,
      submitStatus,
      validateStatus,
    }),
    [
      fieldAtoms,
      values,
      errors,
      dirty,
      touchedFields,
      submitCount,
      submitStatus,
      validateStatus,
    ]
  );
}

/**
 * A hook that returns a set of actions that can be used to update the state
 * of the form atom. This includes updating fields, submitting, resetting,
 * and validating the form.
 *
 * @param {FormAtom<FormFields>} formAtom - The atom that stores the form state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 */
export function useFormActions<Fields extends FormFields>(
  formAtom: FormAtom<Fields>,
  options?: UseAtomOptions
): UseFormActions<Fields> {
  const form = useAtomValue(formAtom, options);
  const updateFields = useSetAtom(form.fields, options);
  const reset = useSetAtom(form.reset, options);
  const validate = useSetAtom(form.validate, options);
  const handleSubmit = useSetAtom(form.submit, options);
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
 * @param {FormAtom<FormFields>} formAtom - The atom that stores the form data.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns The errors of the form.
 */
export function useFormErrors<Fields extends FormFields>(
  formAtom: FormAtom<Fields>,
  options?: UseAtomOptions
): UseFormErrors<Fields> {
  const form = useAtomValue(formAtom, options);
  return useAtomValue(form.errors, options);
}

/**
 * A hook that returns the values of the form atom
 *
 * @param {FormAtom<FormFields>} formAtom - The atom that stores the form state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns The values of the form.
 */
export function useFormValues<Fields extends FormFields>(
  formAtom: FormAtom<Fields>,
  options?: UseAtomOptions
): UseFormValues<Fields> {
  const form = useAtomValue(formAtom, options);
  return useAtomValue(form.values, options);
}

/**
 * A hook that returns the `submitStatus` and `validateStatus` of
 * the form atom.
 *
 * @param {FormAtom<FormFields>} formAtom - The atom that stores the form state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns An object containing the `submitStatus` and
 *   `validateStatus` of the form
 */
export function useFormStatus<Fields extends FormFields>(
  formAtom: FormAtom<Fields>,
  options?: UseAtomOptions
): UseFormStatus {
  const form = useAtomValue(formAtom);
  const submitStatus = useAtomValue(form.submitStatus, options);
  const validateStatus = useAtomValue(form.validateStatus, options);

  return React.useMemo(
    () => ({ submitStatus, validateStatus }),
    [submitStatus, validateStatus]
  );
}

/**
 * A hook that returns a callback for handling form submission.
 *
 * @param {FormAtom<FormFields>} formAtom - The atom that stores the form state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns A callback for handling form submission. The callback
 *   takes the form values as an argument and returs an additional callback
 *   that invokes `event.preventDefault()` if it receives an event as its argument.
 */
export function useFormSubmit<Fields extends FormFields>(
  formAtom: FormAtom<Fields>,
  options?: UseAtomOptions
): UseFormSubmit<Fields> {
  const [, startTransition] = useTransition();
  const form = useAtomValue(formAtom, options);
  const handleSubmit = useSetAtom(form.submit, options);
  return React.useCallback(
    (values: Parameters<typeof handleSubmit>[0]) =>
      (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        startTransition(() => {
          handleSubmit(values);
        });
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
  const initialValueAtom = atomWithReset<Value | undefined>(undefined);
  const baseValueAtom = atomWithReset(config.value);
  const valueAtom = atom(
    (get) => get(baseValueAtom),
    (_get, set, value: Value | typeof RESET) => {
      return config.preprocess && value !== RESET
        ? set(baseValueAtom, config.preprocess(value))
        : set(baseValueAtom, value);
    }
  ) as typeof baseValueAtom;
  const touchedAtom = atomWithReset(config.touched ?? false);
  const dirtyAtom = atom((get) => {
    const initialValue = get(initialValueAtom) ?? config.value;
    return get(valueAtom) !== initialValue;
  });
  const errorsAtom = atom<string[]>([]);

  const validateCountAtom = atom(0);
  const validateStatusAtom = atom<ValidateStatus>("valid");
  const validateAtom = atom<null, [] | [ValidateOn], void>(
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
          set,
          dirty,
          touched: get(touchedAtom),
          value,
          event: event,
        });

        if (isPromise(maybeValidatePromise)) {
          ptr === get(validateCountAtom) &&
            set(validateStatusAtom, "validating");
          errors = (await maybeValidatePromise) ?? get(errorsAtom);
        } else {
          errors = maybeValidatePromise ?? get(errorsAtom);
        }

        if (ptr === get(validateCountAtom)) {
          set(errorsAtom, errors);
          set(validateStatusAtom, errors.length > 0 ? "invalid" : "valid");
        }
      }

      resolveErrors();
    }
  );

  const refAtom = atom<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  >(null);

  const resetAtom = atom<null, [void], void>(null, (get, set) => {
    set(errorsAtom, []);
    set(touchedAtom, RESET);
    set(valueAtom, get(initialValueAtom) ?? config.value);
    // Need to set a new pointer to prevent stale validation results
    // from being set to state after this invocation.
    set(validateCountAtom, (count) => ++count);
    set(validateStatusAtom, "valid");
  });

  const fieldAtoms = {
    name: nameAtom,
    value: valueAtom,
    touched: touchedAtom,
    dirty: dirtyAtom,
    validate: validateAtom,
    validateStatus: validateStatusAtom,
    errors: errorsAtom,
    reset: resetAtom,
    ref: refAtom,
    _initialValue: initialValueAtom,
    _validateCount: validateCountAtom,
    _validateCallback: config.validate,
  };

  const field = atom(fieldAtoms);

  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    Object.entries(fieldAtoms).map(([atomName, atom]) => {
      if (isAtom(atom)) {
        atom.debugLabel = `field/${atomName}/${config.name ?? `${field}`}`;
      }
    });
  }

  return field;
}

/**
 * A hook that returns a set of actions that can be used to interact with the
 * field atom state.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns A set of actions that can be used to interact with the field atom.
 */
export function useFieldActions<Value>(
  fieldAtom: FieldAtom<Value>,
  options?: UseAtomOptions
): UseFieldActions<Value> {
  const field = useAtomValue(fieldAtom, options);
  const setValue = useSetAtom(field.value, options);
  const setTouched = useSetAtom(field.touched, options);
  const setErrors = useSetAtom(field.errors, options);
  const validate = useSetAtom(field.validate, options);
  const reset = useSetAtom(field.reset, options);
  const ref = useAtomValue(field.ref, options);
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
 * directly into an `<input>` element.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseInputFieldPropsOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns A set of props that can be destructured directly into an `<input>`.
 */
export function useInputFieldProps<
  Type extends React.HTMLInputTypeAttribute,
  Value extends InputFieldValueForType<Type> = InputFieldValueForType<Type>
>(
  fieldAtom: FieldAtom<Value>,
  options: UseInputFieldPropsOptions<Type> = {}
): UseInputFieldProps<Type> {
  const field = useAtomValue(fieldAtom, options);
  const name = useAtomValue(field.name, options);
  const [value, setValue] = useAtom(field.value, options);
  const setTouched = useSetAtom(field.touched, options);
  const validateStatus = useAtomValue(field.validateStatus, options);
  const validate = useSetAtom(field.validate, options);
  const ref = useSetAtom(field.ref, options);
  const [, startTransition] = useTransition();
  const { type: fieldType = "text" } = options;

  return React.useMemo(
    () => ({
      name,
      // @ts-expect-error: it's fine, we will test
      value: fileTypes.has(fieldType)
        ? undefined
        : value === null
        ? ""
        : Array.isArray(value)
        ? value.map((v) => v + "")
        : value instanceof Date
        ? formatDateString(value, fieldType)
        : value,
      "aria-invalid": validateStatus === "invalid",
      // @ts-expect-error: it's fine because we default to string which == text
      type: fieldType,
      ref,
      onBlur() {
        setTouched(true);
        startTransition(() => {
          validate("blur");
        });
      },
      onChange(event) {
        const target = event.currentTarget;
        const setAnyValue: any = setValue;
        const anyFieldType: any = fieldType;

        setAnyValue(
          anyFieldType === "datetime-local"
            ? new Date(target.valueAsNumber)
            : target[
                fileTypes.has(anyFieldType)
                  ? "files"
                  : dateTypes.has(anyFieldType)
                  ? "valueAsDate"
                  : numberTypes.has(anyFieldType)
                  ? "valueAsNumber"
                  : "value"
              ]
        );

        startTransition(() => {
          validate("change");
        });
      },
    }),
    [
      name,
      value,
      validateStatus,
      ref,
      setTouched,
      validate,
      setValue,
      fieldType,
    ]
  );
}

const numberTypes = new Set(["number", "range"] as const);
const dateTypes = new Set([
  "date",
  "datetime-local",
  "month",
  "week",
  "time",
] as const);
const fileTypes = new Set(["file"] as const);

/**
 * A hook that returns a set of props that can be destructured
 * directly into an `<textarea>` element.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseTextareaFieldPropsOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns A set of props that can be destructured directly into an `<textarea>`.
 */
export function useTextareaFieldProps<Value extends string>(
  fieldAtom: FieldAtom<Value>,
  options: UseTextareaFieldPropsOptions = {}
): UseTextareaFieldProps<Value> {
  const props = useInputFieldProps<"text", Value>(fieldAtom, options);
  // @ts-expect-error: we are futzing around with onChange/onBlur/ref but
  //  it's my library so I can do what I want
  return React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, ...forwardedProps } = props;
    return forwardedProps;
  }, [props]);
}

/**
 * A hook that returns a set of props that can be destructured
 * directly into an `<select>` element.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseSelectFieldPropsOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns A set of props that can be destructured directly into an `<select>`.
 */
export function useSelectFieldProps<
  Value extends string = string,
  Multiple extends Readonly<boolean> = false
>(
  fieldAtom: FieldAtom<Multiple extends true ? Value[] : Value>,
  options: UseSelectFieldPropsOptions<Multiple> = {}
): UseSelectFieldProps<Value, Multiple> {
  const field = useAtomValue(fieldAtom, options);
  const setValue = useSetAtom(field.value, options);
  const validate = useSetAtom(field.validate, options);
  const [, startTransition] = useTransition();
  const { multiple } = options;
  // @ts-expect-error: we will live
  const inputProps = useInputFieldProps<any, string | string[]>(
    fieldAtom,
    options
  );

  return React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, onChange, ...forwardedProps } = inputProps;

    return {
      ...forwardedProps,
      multiple,
      onChange(event: React.ChangeEvent<HTMLSelectElement>) {
        if (multiple) {
          const options = event.currentTarget.options;
          const values: string[] = [];

          for (const i in options) {
            const option = options[i];

            if (option.selected) {
              values.push(option.value);
            }
          }

          // @ts-expect-error: it's fine
          setValue(values);
        } else {
          // @ts-expect-error: it's fine
          setValue(event.currentTarget.value);
        }

        startTransition(() => {
          validate("change");
        });
      },
    } as unknown as UseSelectFieldProps<Value, Multiple>;
  }, [inputProps, validate, startTransition, setValue, multiple]);
}

/**
 * A hook that returns the state of a field atom. This includes the field's
 * value, whether it has been touched, whether it is dirty, the validation status,
 * and any errors.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns The state of the field atom.
 */
export function useFieldState<Value>(
  fieldAtom: FieldAtom<Value>,
  options?: UseAtomOptions
): UseFieldState<Value> {
  const field = useAtomValue(fieldAtom, options);
  const value = useAtomValue(field.value, options);
  const touched = useAtomValue(field.touched, options);
  const dirty = useAtomValue(field.dirty, options);
  const validateStatus = useAtomValue(field.validateStatus, options);
  const errors = useAtomValue(field.errors, options);

  return React.useMemo(
    () => ({
      value,
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
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns The value of the field atom.
 */
export function useFieldValue<Value>(
  fieldAtom: FieldAtom<Value>,
  options?: UseAtomOptions
): UseFieldValue<Value> {
  const field = useAtomValue(fieldAtom, options);
  return useAtomValue(field.value, options);
}

/**
 * A hook that returns the errors of a field atom.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 * @returns The errors of the field atom.
 */
export function useFieldErrors<Value>(
  fieldAtom: FieldAtom<Value>,
  options?: UseAtomOptions
): UseFieldErrors<Value> {
  const field = useAtomValue(fieldAtom, options);
  return useAtomValue(field.errors, options);
}

/**
 * Sets the initial value of a field atom.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that you want to use to store the value.
 * @param {Value} initialValue - The initial value of the field or `RESET` to reset the initial value.
 * @param {UseAtomOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 */
export function useFieldInitialValue<Value>(
  fieldAtom: FieldAtom<Value>,
  initialValue?: Value | typeof RESET,
  options?: UseFieldInitialValueOptions<Value>
): UseFieldInitialValue {
  const field = useAtomValue(fieldAtom, options);
  const store = useStore(options);
  useHydrateAtoms(
    initialValue
      ? [
          [field._initialValue, initialValue],
          [field.value, initialValue],
        ]
      : [],
    options
  );

  React.useEffect(() => {
    const areEqual = (options && options.areEqual) || defaultValuesAreEqual;

    if (initialValue === undefined) {
      return;
    }

    if (
      !store.get(field.dirty) &&
      !areEqual(initialValue, store.get(field.value))
    ) {
      store.set(field.value, initialValue);
    }

    if (!areEqual(initialValue, store.get(field._initialValue))) {
      store.set(field._initialValue, initialValue);
    }
  });
}

function defaultValuesAreEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      (Object.is(a, b) || a.every((v, i) => defaultValuesAreEqual(v, b[i])))
    );
  }

  return Object.is(a, b);
}

/**
 * A hook that returns `state` and `actions` of a field atom from
 * `useFieldState` and `useFieldActions`.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseFieldOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 */
export function useField<Value>(
  fieldAtom: FieldAtom<Value>,
  options?: UseFieldOptions<Value>
): UseField<Value> {
  useFieldInitialValue(fieldAtom, options?.initialValue, options);
  const actions = useFieldActions<Value>(fieldAtom, options);
  const state = useFieldState<Value>(fieldAtom, options);
  return React.useMemo(() => ({ actions, state }), [actions, state]);
}

/**
 * A hook that returns `props`, `state`, and `actions` of a field atom from
 * `useInputFieldProps`, `useFieldState`, and `useFieldActions`.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseInputFieldOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 */
export function useInputField<
  Type extends React.HTMLInputTypeAttribute,
  Value extends InputFieldValueForType<Type> = InputFieldValueForType<Type>
>(
  fieldAtom: FieldAtom<Value>,
  options?: UseInputFieldOptions<Type, Value>
): UseInputField<Type, Value> {
  const props = useInputFieldProps(fieldAtom, options);
  return _useField<Type, Value>(fieldAtom, props, options);
}

/**
 * A hook that returns `props`, `state`, and `actions` of a field atom from
 * `useInputFieldProps`, `useFieldState`, and `useFieldActions`.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseInputFieldOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 */
export function useSelectField<
  Multiple extends Readonly<boolean> = false,
  Value extends string = string
>(
  fieldAtom: FieldAtom<Multiple extends true ? Value[] : Value>,
  options?: UseSelectFieldOptions<Value, Multiple>
): UseSelectField<Value, Multiple> {
  const props = useSelectFieldProps<Value, Multiple>(fieldAtom, options);
  // @ts-expect-error: it's fine
  return _useField<Multiple, Value>(fieldAtom, props, options);
}

/**
 * A hook that returns `props`, `state`, and `actions` of a field atom from
 * `useTextareaFieldProps`, `useFieldState`, and `useFieldActions`.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {UseTextareaFieldOptions} options - Options to pass to the underlying `useAtomValue`
 *  and `useSetAtom` hooks.
 */
export function useTextareaField<Value extends string>(
  fieldAtom: FieldAtom<Value>,
  options?: UseTextareaFieldOptions<Value>
): UseTextareaField<Value> {
  const props = useTextareaFieldProps(fieldAtom, options);
  return _useField<Value>(fieldAtom, props, options);
}

function _useField<Value extends string>(
  fieldAtom: FieldAtom<Value>,
  props: UseTextareaFieldProps<Value>,
  options?: UseTextareaFieldOptions<Value>
): UseTextareaField<Value>;
function _useField<Multiple extends Readonly<boolean>, Value extends string>(
  fieldAtom: FieldAtom<Value>,
  props: UseSelectFieldProps<Value, Multiple>,
  options?: UseSelectFieldOptions<Value, Multiple>
): UseSelectField<Value, Multiple>;
function _useField<
  Type extends React.HTMLInputTypeAttribute,
  Value extends InputFieldValueForType<Type> = InputFieldValueForType<Type>
>(
  fieldAtom: FieldAtom<Value>,
  props: UseInputFieldProps<Type>,
  options?: UseInputFieldOptions<Type, Value>
): UseInputField<Type, Value>;
function _useField(fieldAtom: FieldAtom<any>, props: any, options?: any): any {
  const field = useField(fieldAtom, options);
  useFieldInitialValue(fieldAtom, options?.initialValue, options);
  return React.useMemo(() => ({ props, ...field }), [props, field]);
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

export {
  /**
   * Reset an atom to its initial value.
   */
  RESET,
};

/**
 * A function that walks through an object containing nested field atoms
 * and calls a visitor function for each atom it finds.
 *
 * @param {FormFields} fields - An object containing nested field atoms
 * @param visitor - A function that will be called for each field atom. You can
 *  exit early by returning `false` from the function.
 * @param path - The base path of the field atom.
 */
export function walkFields<Fields extends FormFields>(
  fields: Fields,
  visitor: (field: FieldAtom<any> | null, path: string[]) => void | false,
  options: {
    includeEmptyArrays: true;
  },
  path?: string[]
): void;
export function walkFields<Fields extends FormFields>(
  fields: Fields,
  visitor: (field: FieldAtom<any>, path: string[]) => void | false,
  options: {
    includeEmptyArrays: false;
  },
  path?: string[]
): void;
export function walkFields<Fields extends FormFields>(
  fields: Fields,
  visitor: (field: FieldAtom<any>, path: string[]) => void | false,
  options?: {
    includeEmptyArrays?: boolean;
  },
  path?: string[]
): void;
export function walkFields<Fields extends FormFields>(
  fields: Fields,
  visitor: (field: FieldAtom<any>, path: string[]) => void | false,
  options: any = {},
  path: string[] = []
): void {
  for (const key in fields) {
    path.push(key);
    const field = fields[key];

    if (isAtom(field)) {
      if (visitor(field, path) === false) return;
    } else if (Array.isArray(field)) {
      if (!field.length && options.includeEmptyArrays) {
        // @ts-expect-error: it's fine for now
        visitor(null, path);
      } else {
        for (const key in field) {
          path.push(key);
          const subField = field[key];

          if (isAtom(subField)) {
            if (visitor(subField, path) === false) return;
          } else {
            walkFields(subField, visitor, options, path);
          }

          path.pop();
        }
      }
    } else if (typeof field === "object") {
      walkFields(field, visitor, options, path);
    }

    path.pop();
  }
}

export type InputFieldProps<
  Type extends React.HTMLInputTypeAttribute,
  Value extends InputFieldValueForType<Type> = InputFieldValueForType<Type>
> = (UseInputFieldOptions<Type, Value> & {
  /**
   * A field atom
   */
  atom: FieldAtom<Value>;
  /**
   * The initial value of the field
   */
  initialValue?: Value;
}) &
  (
    | {
        /**
         * A render prop
         *
         * @param props - Props that can be directly unpacked into a native HTML `<input>` element
         * @param state - The state of the field atom
         * @param actions - The actions of the field atom
         */
        render(
          props: UseInputFieldProps<Type>,
          state: UseFieldState<Value>,
          actions: UseFieldActions<Value>
        ): JSX.Element;
      }
    | {
        /**
         * A React component
         */
        component: "input" | React.ComponentType<UseInputFieldProps<Type>>;
      }
  );

export type SelectFieldProps<
  Value extends string,
  Multiple extends Readonly<boolean> = false
> = (UseSelectFieldOptions<Value, Multiple> & {
  /**
   * A field atom
   */
  atom: FieldAtom<Multiple extends true ? Value[] : Value>;
  /**
   * The initial value of the field
   */
  initialValue?: Multiple extends true ? Value[] : Value;
}) &
  (
    | {
        /**
         * A render prop
         *
         * @param props - Props that can be directly unpacked into a native HTML `<select>` element
         * @param state - The state of the field atom
         * @param actions - The actions of the field atom
         */
        render(
          props: UseSelectFieldProps<Value, Multiple>,
          state: UseFieldState<Multiple extends true ? Value[] : Value>,
          actions: UseFieldActions<Multiple extends true ? Value[] : Value>
        ): JSX.Element;
      }
    | {
        /**
         * A React component
         */
        component:
          | "select"
          | React.ComponentType<UseSelectFieldProps<Value, Multiple>>;
      }
  );

export type TextareaFieldProps<Value extends string> =
  (UseTextareaFieldOptions<Value> & {
    /**
     * A field atom
     */
    atom: FieldAtom<Value>;
    /**
     * The initial value of the field
     */
    initialValue?: Value;
  }) &
    (
      | {
          /**
           * A render prop
           *
           * @param props - Props that can be directly unpacked into a native HTML `<textarea>` element
           * @param state - The state of the field atom
           * @param actions - The actions of the field atom
           */
          render(
            props: UseTextareaFieldProps<Value>,
            state: UseFieldState<Value>,
            actions: UseFieldActions<Value>
          ): JSX.Element;
        }
      | {
          /**
           * A React component
           */
          component:
            | "textarea"
            | React.ComponentType<UseTextareaFieldProps<Value>>;
        }
    );

export type FieldProps<Value> = (UseAtomOptions & {
  /**
   * A field atom
   */
  atom: FieldAtom<Value>;
  /**
   * The initial value of the field
   */
  initialValue?: Value;
}) &
  (
    | {
        /**
         * A render prop
         *
         * @param state - The state of the field atom
         * @param actions - The actions of the field atom
         */
        render(
          state: UseFieldState<Value>,
          actions: UseFieldActions<Value>
        ): JSX.Element;
      }
    | {
        /**
         * A React component
         */
        component: React.ComponentType<{
          state: UseFieldState<Value>;
          actions: UseFieldActions<Value>;
        }>;
      }
  );

export type FormProps<Fields extends FormFields> = {
  /**
   * A form atom
   */
  atom: FormAtom<Fields>;
  /**
   * When using atoms with a scope, the provider with the same scope will be used.
   * The recommendation for the scope value is a unique symbol. The primary use case
   * of scope is for library usage.
   */
  store?: AtomStore;
} & (
  | {
      /**
       * A render prop
       *
       * @param props - Props returned from a `useForm` hook
       */
      render(props: UseForm<Fields>): JSX.Element;
    }
  | {
      /**
       * A React component.
       */
      component: React.ComponentType<UseForm<Fields>>;
    }
);

/**
 * A form submission status
 */
export type SubmitStatus = "idle" | "submitting" | "submitted";
/**
 * A form and field validation status
 */
export type ValidateStatus = "validating" | "valid" | "invalid";
/**
 * Event types that a field atom may validate against
 */
export type ValidateOn = "user" | "blur" | "change" | "touch" | "submit";

export type FieldAtom<Value> = Atom<{
  /**
   * An atom containing the field's name
   */
  name: WritableAtom<
    string | undefined,
    [string | undefined | typeof RESET],
    void
  >;
  /**
   * An atom containing the field's value
   */
  value: WritableAtom<
    Value,
    [Value | typeof RESET | ((prev: Value) => Value)],
    void
  >;
  /**
   * An atom containing the field's touched status
   */
  touched: WritableAtom<
    boolean,
    [boolean | typeof RESET | ((prev: boolean) => boolean)],
    void
  >;
  /**
   * An atom containing the field's dirty status
   */
  dirty: Atom<boolean>;
  /**
   * A write-only atom for validating the field's value
   */
  validate: WritableAtom<null, [] | [ValidateOn], void>;
  /**
   * An atom containing the field's validation status
   */
  validateStatus: WritableAtom<ValidateStatus, [ValidateStatus], void>;
  /**
   * An atom containing the field's validation errors
   */
  errors: WritableAtom<
    string[],
    [string[] | ((value: string[]) => string[])],
    void
  >;
  /**
   * A write-only atom for resetting the field atoms to their
   * initial states.
   */
  reset: WritableAtom<null, [], void>;
  /**
   * An atom containing a reference to the `HTMLElement` the field
   * is bound to.
   */
  ref: WritableAtom<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null,
    [
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | null
      | ((
          value:
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement
            | null
        ) => HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)
    ],
    void
  >;
  /**
   * An atom containing the field's initial value
   */
  _initialValue: WritableAtom<
    Value | undefined,
    [
      | Value
      | undefined
      | typeof RESET
      | ((prev: Value | undefined) => Value | undefined)
    ],
    void
  >;
  _validateCount: WritableAtom<
    number,
    [number | ((current: number) => number)],
    void
  >;
  _validateCallback?: Validate<Value>;
}>;

export type FormAtom<Fields extends FormFields> = Atom<{
  /**
   * An atom containing an object of nested field atoms
   */
  fields: WritableAtom<
    Fields,
    [Fields | typeof RESET | ((prev: Fields) => Fields)],
    void
  >;
  /**
   * An read-only atom that derives the form's values from
   * its nested field atoms.
   */
  values: Atom<FormFieldValues<Fields>>;
  /**
   * An read-only atom that derives the form's errors from
   * its nested field atoms.
   */
  errors: Atom<FormFieldErrors<Fields>>;
  /**
   * A read-only atom that returns `true` if any of the fields in
   * the form are dirty.
   */
  dirty: Atom<boolean>;
  /**
   * A read-only atom derives the touched state of its nested field atoms.
   */
  touchedFields: Atom<TouchedFields<Fields>>;
  /**
   * A write-only atom that resets the form's nested field atoms
   */
  reset: WritableAtom<null, [], void>;
  /**
   * A write-only atom that validates the form's nested field atoms
   */
  validate: WritableAtom<null, [] | [ValidateOn], void>;
  /**
   * A read-only atom that derives the form's validation status
   */
  validateStatus: Atom<ValidateStatus>;
  /**
   * A write-only atom for submitting the form
   */
  submit: WritableAtom<
    null,
    [(value: FormFieldValues<Fields>) => void | Promise<void>],
    void
  >;
  /**
   * A read-only atom that reads the number of times the form has
   * been submitted
   */
  submitCount: Atom<number>;
  /**
   * An atom that contains the form's submission status
   */
  submitStatus: WritableAtom<SubmitStatus, [SubmitStatus], void>;
  _validateFields: (
    get: Getter,
    set: Setter,
    event: ValidateOn
  ) => Promise<void>;
}>;

/**
 * An object containing nested field atoms
 */
export type FormFields = {
  [key: string | number]:
    | FieldAtom<any>
    | FormFields
    | FormFields[]
    | FieldAtom<any>[];
};

/**
 * A utility type for inferring the value types of a form's nested field atoms.
 *
 * @example
 * ```ts
 * const nameForm = formAtom({
 *   name: fieldAtom({ value: '' }),
 * })
 *
 * type NameFormValues = FormValues<typeof nameForm>
 * ```
 */
export type FormValues<Form extends FormAtom<any>> = Form extends FormAtom<
  infer Fields
>
  ? FormFieldValues<Fields>
  : never;

/**
 * A utility type for inferring the error types of a form's nested field atoms.
 *
 * @example
 * ```ts
 * const nameForm = formAtom({
 *   name: fieldAtom({ value: '' }),
 * })
 *
 * type NameFormErrors = FormErrors<typeof nameForm>
 * ```
 */
export type FormErrors<Form extends FormAtom<any>> = Form extends FormAtom<
  infer Fields
>
  ? FormFieldErrors<Fields>
  : never;

/**
 * An object containing the values of a form's nested field atoms
 */
export type FormFieldValues<Fields extends FormFields> = Flatten<{
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<infer Value>
    ? Value
    : Fields[Key] extends FormFields
    ? FormFieldValues<Fields[Key]>
    : Fields[Key] extends Array<infer Item>
    ? Item extends FieldAtom<infer Value>
      ? Value[]
      : Item extends FormFields
      ? FormFieldValues<Item>[]
      : never
    : never;
}>;

/**
 * An object containing the errors of a form's nested field atoms
 */
export type FormFieldErrors<Fields extends FormFields> = Flatten<{
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<any>
    ? string[]
    : Fields[Key] extends FormFields
    ? FormFieldErrors<Fields[Key]>
    : Fields[Key] extends Array<infer Item>
    ? Item extends FieldAtom<any>
      ? string[][]
      : Item extends FormFields
      ? FormFieldErrors<Item>[]
      : never
    : never;
}>;

/**
 * An object containing the errors of a form's touched fields
 */
export type TouchedFields<Fields extends FormFields> = Flatten<{
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<any>
    ? boolean
    : Fields[Key] extends FormFields
    ? FormFieldValues<Fields[Key]>
    : Fields[Key] extends Array<infer Item>
    ? Item extends FieldAtom<any>
      ? boolean[]
      : Item extends FormFields
      ? TouchedFields<Item>[]
      : never
    : never;
}>;

export type UseForm<Fields extends FormFields> = {
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
    handleSubmit: (values: FormFieldValues<Fields>) => void | Promise<void>
  ): (event?: React.FormEvent<HTMLFormElement>) => void;
  /**
   * A function that validates the form's nested field atoms with a
   * `"user"` validation event.
   */
  validate(): void;
  /**
   * A function that resets the form's nested field atoms to their
   * initial states.
   */
  reset(event?: React.FormEvent<HTMLFormElement>): void;
};

export type UseFormStatus = {
  /**
   * The validation status of the form
   */
  validateStatus: ValidateStatus;
  /**
   * The submission status of the form
   */
  submitStatus: SubmitStatus;
};

export type UseFormSubmit<Fields extends FormFields> = {
  (values: (value: FormFieldValues<Fields>) => void | Promise<void>): (
    event?: React.FormEvent<HTMLFormElement>
  ) => void;
};

export type UseFormState<Fields extends FormFields> = {
  /**
   * An object containing the form's nested field atoms
   */
  fieldAtoms: Fields;
  /**
   * An object containing the values of a form's nested field atoms
   */
  values: FormFieldValues<Fields>;
  /**
   * An object containing the errors of a form's nested field atoms
   */
  errors: FormFieldErrors<Fields>;
  /**
   * `true` if any of the fields in the form are dirty.
   */
  dirty: boolean;
  /**
   * An object containing the touched state of the form's nested field atoms.
   */
  touchedFields: TouchedFields<Fields>;
  /**
   * The number of times a form has been submitted
   */
  submitCount: number;
  /**
   * The validation status of the form
   */
  validateStatus: ValidateStatus;
  /**
   * The submission status of the form
   */
  submitStatus: SubmitStatus;
};

export type UseFormActions<Fields extends FormFields> = {
  /**
   * A function for adding/removing fields from the form.
   *
   * @param fields - An object containing the form's nested field atoms or
   *   a callback that receives the current fields and returns the next
   *   fields.
   */
  updateFields(
    fields: ExtractAtomArgs<ExtractAtomValue<FormAtom<Fields>>["fields"]>[0]
  ): void;
  /**
   * A function for handling form submissions.
   *
   * @param handleSubmit - A function that is called with the form's values
   *   when the form is submitted
   */
  submit(
    handleSubmit: (values: FormFieldValues<Fields>) => void | Promise<void>
  ): (event?: React.FormEvent<HTMLFormElement>) => void;
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
};

type UseFormErrors<Fields extends FormFields> = FormFieldErrors<Fields>;
type UseFormValues<Fields extends FormFields> = FormFieldValues<Fields>;

export type UseField<Value> = {
  /**
   * Actions for managing the state of the field
   */
  actions: UseFieldActions<Value>;
  /**
   * The current state of the field
   */
  state: UseFieldState<Value>;
};

export type UseInputField<
  Type extends React.HTMLInputTypeAttribute,
  Value extends InputFieldValueForType<Type> = InputFieldValueForType<Type>
> = {
  /**
   * `<input>` props for the field
   */
  props: UseInputFieldProps<Type>;
  /**
   * Actions for managing the state of the field
   */
  actions: UseFieldActions<Value>;
  /**
   * The current state of the field
   */
  state: UseFieldState<Value>;
};

export type UseInputFieldProps<Type extends React.HTMLInputTypeAttribute> = {
  /**
   * The name of the field if there is one
   */
  name: string | undefined;
  /**
   * The value of the field
   */
  value: Type extends DateType
    ? string
    : Type extends NumberType
    ? number | string
    : Type extends FileType
    ? undefined
    : string;
  /**
   * The type of the field
   *
   * @default "text"
   */
  type: Type;
  /**
   * A WAI-ARIA property that tells a screen reader whether the
   * field is invalid
   */
  "aria-invalid": boolean;
  /**
   * A React callback ref that is used to bind the field atom to
   * an `<input>` element so that it can be read and focused.
   */
  ref: React.RefCallback<HTMLInputElement>;
  onBlur(event: React.FormEvent<HTMLInputElement>): void;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
};

export type UseInputFieldPropsOptions<
  Type extends React.HTMLInputTypeAttribute
> = UseAtomOptions & {
  /**
   * The type of the `<input>` element
   *
   * @default "text"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#%3Cinput%3E_types
   */
  type?: Type;
};

export type DateType = typeof dateTypes extends Set<infer T> ? T : never;
export type NumberType = typeof numberTypes extends Set<infer T> ? T : never;
export type FileType = typeof fileTypes extends Set<infer T> ? T : never;

/**
 * A utility type that maps input types to their corresponding
 * value types.
 */
export type InputFieldValueForType<Type extends React.HTMLInputTypeAttribute> =
  Type extends NumberType
    ? number | null
    : Type extends DateType
    ? Date | null
    : Type extends FileType
    ? FileList | null
    : string;

export type UseSelectField<
  Value extends string,
  Multiple extends Readonly<boolean> = false
> = {
  /**
   * `<input>` props for the field
   */
  props: UseSelectFieldProps<Value, Multiple>;
  /**
   * Actions for managing the state of the field
   */
  actions: UseFieldActions<Multiple extends true ? Value[] : Value>;
  /**
   * The current state of the field
   */
  state: UseFieldState<Multiple extends true ? Value[] : Value>;
};

export type UseSelectFieldProps<
  Value extends string,
  Multiple extends Readonly<boolean> = false
> = {
  /**
   * The name of the field if there is one
   */
  name: string | undefined;
  /**
   * The value of the field
   */
  value: Multiple extends true ? Value[] : Value;
  /**
   * Whether the field is a multiple select
   */
  multiple?: Multiple;
  /**
   * A WAI-ARIA property that tells a screen reader whether the
   * field is invalid
   */
  "aria-invalid": boolean;
  /**
   * A React callback ref that is used to bind the field atom to
   * an `<input>` element so that it can be read and focused.
   */
  ref: React.RefCallback<HTMLSelectElement>;
  onBlur(event: React.FormEvent<HTMLSelectElement>): void;
  onChange(event: React.ChangeEvent<HTMLSelectElement>): void;
};

export type UseSelectFieldPropsOptions<Multiple extends Readonly<boolean>> =
  UseAtomOptions & {
    /**
     * Whether the field is a multiple select
     */
    multiple?: Multiple;
  };

export type UseTextareaField<Value extends string> = {
  /**
   * `<input>` props for the field
   */
  props: UseTextareaFieldProps<Value>;
  /**
   * Actions for managing the state of the field
   */
  actions: UseFieldActions<Value>;
  /**
   * The current state of the field
   */
  state: UseFieldState<Value>;
};

export type UseTextareaFieldProps<Value extends string> = {
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
   * an `<input>` element so that it can be read and focused.
   */
  ref: React.RefCallback<HTMLTextAreaElement>;
  onBlur(event: React.FormEvent<HTMLTextAreaElement>): void;
  onChange(event: React.ChangeEvent<HTMLTextAreaElement>): void;
};

export type UseTextareaFieldPropsOptions = UseAtomOptions;

export type UseFieldActions<Value> = {
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
    value: ExtractAtomArgs<ExtractAtomValue<FieldAtom<Value>>["value"]>[0]
  ): void;
  /**
   * A function for changing the touched state of a field. This will trigger a
   * `"touch"` validation event.
   *
   * @param {boolean} touched - The new touched state of the field
   */
  setTouched(
    touched: ExtractAtomArgs<ExtractAtomValue<FieldAtom<Value>>["touched"]>[0]
  ): void;
  /**
   * A function for changing the error state of a field
   *
   * @param {string[]} errors - The new error state of the field
   */
  setErrors(
    errors: ExtractAtomArgs<ExtractAtomValue<FieldAtom<Value>>["errors"]>[0]
  ): void;
  /**
   * Focuses the field atom's `<input>` element if there is one bound to it.
   */
  focus(): void;
  /**
   * Resets the field atom to its initial state.
   */
  reset(): void;
};

export type UseFieldState<Value> = {
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
};

export type UseFieldValue<Value> = Value;
export type UseFieldErrors<Value> = UseFieldState<Value>["errors"];
export type UseFieldInitialValue = void;
export type UseFieldOptions<Value> = UseAtomOptions & { initialValue?: Value };
export type UseInputFieldOptions<
  Type extends React.HTMLInputTypeAttribute,
  Value extends InputFieldValueForType<Type> = InputFieldValueForType<Type>
> = UseInputFieldPropsOptions<Type> & {
  /**
   * The initial value of the field
   */
  initialValue?: Value;
};
export type UseSelectFieldOptions<
  Value extends string = string,
  Multiple extends Readonly<boolean> = false
> = UseSelectFieldPropsOptions<Multiple> & {
  /**
   * The initial value of the field
   */
  initialValue?: Multiple extends true ? Value[] : Value;
};
export type UseTextareaFieldOptions<Value extends string> =
  UseTextareaFieldPropsOptions & {
    /**
     * The initial value of the field
     */
    initialValue?: Value;
  };

export type FieldAtomConfig<Value> = {
  /**
   * Optionally provide a name for the field that will be added
   * to any attached `<input>` elements
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
   * Transform the value of the field each time `setValue` is
   * called and before validation
   */
  preprocess?: (value: Value) => Value;
  /**
   * A function that validates the value of the field any time
   * one of its atoms changes. It must either return an array of
   * string error messages or undefined. If it returns undefined,
   * the validation is "skipped" and the current errors in state
   * are retained.
   */
  validate?: (state: {
    /**
     * A Jotai getter that can read other atoms
     */
    get: Getter;
    /**
     * A Jotai setter that can write to atoms
     */
    set: Setter;
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
    event: ValidateOn;
  }) => void | string[] | Promise<void | string[]>;
};

/**
 * A utility type for easily typing validate functions
 */
export type Validate<Value> = FieldAtomConfig<Value>["validate"];

/**
 * A utility type for easily typing validate function configurations
 */
export type ValidateConfig<Value> = Parameters<
  Exclude<FieldAtomConfig<Value>["validate"], undefined>
>[0];

/**
 * A Jotai store
 *
 * @see https://jotai.org/docs/api/core#createstore
 */
export type AtomStore = ReturnType<typeof createStore>;

/**
 * Options that are forwarded to the `useAtom`, `useAtomValue`,
 * and `useSetAtom` hooks
 */
export type UseAtomOptions = {
  delay?: number;
  /**
   * Optionally provide a Jotai store to use for the atom.
   */
  store?: AtomStore;
};

export type UseFieldInitialValueOptions<Value> = UseAtomOptions & {
  /**
   * When fields are not dirty and their current value is not equal to
   * their initial value, the initial value will be set as the current
   * value.
   *
   * @default Object.is
   */
  areEqual?: (
    a: Value | typeof RESET,
    b: Value | typeof RESET | undefined
  ) => boolean;
};

type Flatten<T> = Identity<{ [K in keyof T]: T[K] }>;
type Identity<T> = T;
