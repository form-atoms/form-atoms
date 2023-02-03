<hr/>

# form-atoms

> Atomic form primitives for [Jotai](https://jotai.org/docs/api/core)

```sh
npm i form-atoms jotai
```

<p>
  <a href="https://bundlephobia.com/result?p=form-atoms">
    <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/form-atoms?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Types" href="https://www.npmjs.com/package/form-atoms">
    <img alt="Types" src="https://img.shields.io/npm/types/form-atoms?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Code coverage report" href="https://codecov.io/gh/jaredLunde/form-atoms">
    <img alt="Code coverage" src="https://img.shields.io/codecov/c/gh/jaredLunde/form-atoms?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Build status" href="https://github.com/jaredLunde/form-atoms/actions/workflows/release.yml">
    <img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/jaredLunde/form-atoms/release.yml?branch=main&style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/form-atoms">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/form-atoms?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="License" href="https://jaredlunde.mit-license.org/">
    <img alt="MIT License" src="https://img.shields.io/npm/l/form-atoms?style=for-the-badge&labelColor=24292e">
  </a>
</p>

---

## Features

- [x] **Renders what changes** and nothing else
- [x] **Strongly typed** allowing you to quickly iterate on durable code
- [x] **Tiny** ([<3kB gzipped](https://bundlephobia.com/package/form-atoms)) but powerful API
- [x] **Nested/array fields** without parsing field names
- [x] **Dynamic fields** - you aren't stuck with your initial config
- [x] **Controlled inputs** because no, uncontrolled inputs are not preferrable
- [x] **Ready for concurrent React** - validation updates have a lower priority
- [x] **Familiar API** that is very similar to other form libraries
- [x] **Async field-level validation** with [Zod support](https://github.com/colinhacks/zod)

## Quick start

[Check out the example on CodeSandbox ↗](https://codesandbox.io/s/getting-started-with-form-atoms-v2-ddhgq2?file=/src/App.tsx)

```js
import { fieldAtom, useInputField, formAtom, useForm } from "form-atoms";

const nameFormAtom = formAtom({
  name: {
    first: fieldAtom({ value: "" }),
    last: fieldAtom({ value: "" }),
  },
});

function Form() {
  const { fieldAtoms, submit } = useForm(nameFormAtom);
  return (
    <form
      onSubmit={submit((values) => {
        console.log(values);
      })}
    >
      <Field label="First name" atom={fieldAtoms.name.first} />
      <Field label="Last name" atom={fieldAtoms.name.last} />
    </form>
  );
}

function Field({ label, atom }) {
  const field = useInputField(atom);
  return (
    <label>
      <span>{label}</span>
      <input {...field.props} />
    </label>
  );
}
```

## Concepts

> [Jotai](https://jotai.org/docs/api/core) was born to solve extra re-render
> issue in React. Extra re-render is a render process that produces the same
> UI result, with which users won't see any differences.

Like Jotai, this library was built to solve the extra re-render issue with
React _Forms_. It takes a bottom-up approach using Jotai's atomic model.
In practice that means that [`formAtom()`](#formatom) derives its state from
[`fieldAtom()`](#fieldatom). For example, validation occurs at the field-level
rather than the form-level. Normally that would pose a problem for fields with
validation that is dependent on other state or other fields, but using `fieldAtom`'s
`validate` function allows you to read the value of other atoms.

The `form-atoms` minimal API is written to be ergonomic and powerful. It _feels_
like other form libraries (_even better in my opinion_). You don't lose anything
by using it, but you gain a ton of performance and without footguns.

## Table of contents

| Field atoms                                       | Description                                                                                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`fieldAtom()`](#fieldatom)                       | An atom that represents a field in a form. It manages state for the field, including the name, value, errors, dirty, validation, and touched state.                                                  |
| [`useField()`](#usefield)                         | A hook that returns `state` and `actions` of a field atom from `useFieldState`, and `useFieldActions`.                                                                                               |
| [`useInputField()`](#useinputfield)               | A hook that returns `props`, `state`, and `actions` of a field atom from `useInputFieldProps`, `useFieldState`, and `useFieldActions`.                                                               |
| [`useInputFieldProps()`](#useinputfieldprops)     | A hook that returns a set of props that can be destructured directly into an `<input>`, `<select>`, or `<textarea>` element.                                                                         |
| [`useFieldState()`](#usefieldstate)               | A hook that returns the state of a field atom. This includes the field's value, whether it has been touched, whether it is dirty, the validation status, and any errors.                             |
| [`useFieldActions()`](#usefieldactions)           | A hook that returns a set of actions that can be used to interact with the field atom state.                                                                                                         |
| [`useFieldInitialValue()`](#usefieldinitialvalue) | A hook that sets the initial value of a field atom. Initial values can only be set once per scope. Therefore, if the initial value used is changed during rerenders, it won't update the atom value. |
| [`useFieldValue()`](#usefieldvalue)               | A hook that returns the value of a field atom.                                                                                                                                                       |
| [`useFieldErrors()`](#usefielderrors)             | A hook that returns the errors of a field atom.                                                                                                                                                      |

| Form atoms                            | Description                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`formAtom()`](#formatom)             | An atom that derives its state fields atoms and allows you to submit, validate, and reset your form.                                                                                                                                                                                                                  |
| [`useForm()`](#useform)               | A hook that returns an object that contains the `fieldAtoms` and actions to validate, submit, and reset the form.                                                                                                                                                                                                     |
| [`useFormState()`](#useformstate)     | A hook that returns the primary state of the form atom including values, errors, submit and validation status, as well as the `fieldAtoms`. Note that this hook will cuase its parent component to re-render any time those states change, so it can be useful to use more targeted state hooks like `useFormStatus`. |
| [`useFormActions()`](#useformactions) | A hook that returns a set of actions that can be used to update the state of the form atom. This includes updating fields, submitting, resetting, and validating the form.                                                                                                                                            |
| [`useFormValues()`](#useformvalues)   | A hook that returns the values of the form atom.                                                                                                                                                                                                                                                                      |
| [`useFormErrors()`](#useformerrors)   | A hook that returns the errors of the form atom.                                                                                                                                                                                                                                                                      |
| [`useFormStatus()`](#useformstatus)   | A hook that returns the `submitStatus` and `validateStatus` of the form atom.                                                                                                                                                                                                                                         |
| [`useFormSubmit()`](#useformsubmit)   | A hook that returns a callback for handling form submission.                                                                                                                                                                                                                                                          |

| Components                    | Description                                                                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`<Form>`](#form)             | A React component that renders form atoms and their fields in an isolated scope using a Jotai Provider.                                                                                                  |
| [`<InputField>`](#inputfield) | A React component that renders field atoms with initial values. This is useful for fields that are rendered as native HTML elements because the props can unpack directly into the underlying component. |
| [`<Field>`](#field)           | A React component that renders field atoms with initial values. This is useful for fields that aren't rendered as native HTML elements.                                                                  |

| Utility Types               | Description                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| [`FormValues`](#formvalues) | A utility type for inferring the value types of a form's nested field atoms. |
| [`FormErrors`](#formerrors) | A utility type for inferring the error types of a form's nested field atoms. |

| Validator                          | Description                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`form-atoms/zod`](#form-atomszod) | A validator that can be used with the [Zod](https://github.com/colinhacks/zod) library to validate fields. |

## Recipes

1. [**How to validate on `(blur, change, touch, submit)`**](https://codesandbox.io/s/form-atoms-v2-validate-on-event-example-forked-dkge0i?file=/src/App.tsx)
1. [**How to validate a field conditional to the state of another field**](https://codesandbox.io/s/form-atoms-v2-validate-on-dependent-state-pscr8p?file=/src/App.tsx)
1. [**How to validate a field asynchronously**](https://codesandbox.io/s/form-atoms-v2-validate-asynchronously-i86wyo?file=/src/App.tsx)
1. [**How to validate using a Zod schema**](https://codesandbox.io/s/form-atoms-v2-validate-using-zod-1n1rrr?file=/src/App.tsx)
1. [**How to create a nested fields**](https://codesandbox.io/s/form-atoms-v2-nested-fields-example-lirr6w)
1. [**How to create an array of fields**](https://codesandbox.io/s/form-atoms-v2-array-fields-example-22kf4d?file=/src/App.tsx)

---

## Field atoms

### fieldAtom()

An atom that represents a field in a form. It manages state for the field,
including the name, value, errors, dirty, validation, and touched state.

#### Arguments

| Name   | Type                                         | Required? | Description                                       |
| ------ | -------------------------------------------- | --------- | ------------------------------------------------- |
| config | [`FieldAtomConfig<Value>`](#FieldAtomConfig) | Yes       | The initial state and configuration of the field. |

#### `FieldAtomConfig`

```ts
type FieldAtomConfig<Value> = {
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
   * the validation is "skipped" and the current errors in state
   * are retained.
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
    event: ValidateOn;
  }) => void | string[] | Promise<void | string[]>;
};
```

#### Returns

```ts
type FieldAtom<Value> = Atom<{
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
}>;
```

#### [⇗ Back to top](#table-of-contents)

---

### useField()

A hook that returns `state` and `actions` of a field atom from
[`useFieldState`](#usefieldstate) and [`useFieldActions`](#usefieldactions).

#### Arguments

| Name      | Type                     | Required? | Description                                                                                                                       |
| --------- | ------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>`       | Yes       | The atom that stores the field's state                                                                                            |
| options   | `UseFieldOptions<Value>` | No        | Provide an `initialValue` here in additon to options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks. |

#### Returns

```ts
type UseFieldAtom<Value> = {
  /**
   * Actions for managing the state of the field
   */
  actions: UseFieldActions<Value>;
  /**
   * The current state of the field
   */
  state: UseFieldState<Value>;
};
```

#### [⇗ Back to top](#table-of-contents)

---

### useInputField()

A hook that returns `props`, `state`, and `actions` of a field atom from
[`useInputFieldProps`](#useinputfieldprops), [`useFieldState`](#usefieldstate),
and [`useFieldActions`](#usefieldactions).

#### Arguments

| Name      | Type                          | Required? | Description                                                                                                                       |
| --------- | ----------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>`            | Yes       | The atom that stores the field's state                                                                                            |
| options   | `UseInputFieldOptions<Value>` | No        | Provide an `initialValue` here in additon to options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks. |

#### Returns

```ts
type UseInputField<Value> = {
  /**
   * `<input>`, `<select>`, or `<textarea>` props for the field
   */
  props: UseInputFieldProps<Value>;
  /**
   * Actions for managing the state of the field
   */
  actions: UseFieldActions<Value>;
  /**
   * The current state of the field
   */
  state: UseFieldState<Value>;
};
```

#### [⇗ Back to top](#table-of-contents)

---

### useInputFieldProps()

A hook that returns a set of props that can be destructured directly into an `<input>`, `<select>`, or `<textarea>` element.

#### Arguments

| Name      | Type               | Required? | Description                                                                         |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                              |
| options   | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseInputFieldProps<Value> = {
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
};
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldState()

A hook that returns the state of a field atom. This includes the field's value, whether it has been touched, whether it is dirty, the validation status, and any errors.

#### Arguments

| Name      | Type               | Required? | Description                                                                         |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                              |
| options   | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFieldState<Value> = {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldActions()

A hook that returns a set of actions that can be used to interact with the field atom state.

#### Arguments

| Name      | Type               | Required? | Description                                                                         |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                              |
| options   | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFieldActions<Value> = {
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
   * Focuses the field atom's `<input>`, `<select>`, or `<textarea>` element
   * if there is one bound to it.
   */
  focus(): void;
  /**
   * Resets the field atom to its initial state.
   */
  reset(): void;
};
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldInitialValue()

A hook that sets the initial value of a field atom. Initial values can only be set
once per scope. Therefore, if the initial value used is changed during rerenders,
it won't update the atom value.

#### Arguments

| Name         | Type               | Required? | Description                                                                                 |
| ------------ | ------------------ | --------- | ------------------------------------------------------------------------------------------- |
| fieldAtom    | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                                      |
| initialValue | `Value`            | No        | The initial value to set the atom to. If this is `undefined`, no initial value will be set. |
| options      | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks         |

#### [⇗ Back to top](#table-of-contents)

---

### useFieldValue()

A hook that returns the value of a field atom.

#### Arguments

| Name      | Type               | Required? | Description                                                                         |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                              |
| options   | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFieldValue<Value> = Value;
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldErrors()

A hook that returns the errors of a field atom.

#### Arguments

| Name      | Type               | Required? | Description                                                                         |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                              |
| options   | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFieldErrors<Value> = UseFieldState<Value>["errors"];
```

#### [⇗ Back to top](#table-of-contents)

---

## Form atoms

### formAtom()

An atom that derives its state fields atoms and allows you to submit,
validate, and reset your form.

#### Arguments

| Name   | Type                            | Required? | Description                                                                                                          |
| ------ | ------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| fields | [`FormFields`](#formatomfields) | Yes       | An object containing field atoms to be included in the form. Field atoms can be deeply nested in objects and arrays. |

#### `FormFields`

```ts
type FormFields = {
  [key: string | number]:
    | FieldAtom<any>
    | FormFields
    | FormFields[]
    | FieldAtom<any>[];
};
```

#### Returns

```ts
type FormAtom<Fields extends FormFields> = Atom<{
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
  reset: WritableAtom<null, void>;
  /**
   * A write-only atom that validates the form's nested field atoms
   */
  validate: WritableAtom<null, void | ValidateOn>;
  /**
   * A read-only atom that derives the form's validation status
   */
  validateStatus: Atom<ValidateStatus>;
  /**
   * A write-only atom for submitting the form
   */
  submit: WritableAtom<
    null,
    (values: FormFieldValues<Fields>) => void | Promise<void>
  >;
  /**
   * A read-only atom that reads the number of times the form has
   * been submitted
   */
  submitCount: Atom<number>;
  /**
   * An atom that contains the form's submission status
   */
  submitStatus: WritableAtom<SubmitStatus, SubmitStatus>;
}>;
```

#### [⇗ Back to top](#table-of-contents)

---

### useForm()

A hook that returns an object that contains the `fieldAtoms` and actions to validate, submit, and reset the form.

#### Arguments

| Name     | Type               | Required? | Description                                                                         |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                               |
| options  | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFormAtom<Fields extends FormFields> = {
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
};
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormState()

A hook that returns the primary state of the form atom including values, errors, submit and validation status, as well as the `fieldAtoms`. Note that this hook will cuase its parent component to re-render any time those states change, so it can be useful to use more targeted state hooks like `useFormStatus`.

#### Arguments

| Name     | Type               | Required? | Description                                                                         |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                               |
| options  | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFormState<Fields extends FormFields> = {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormActions()

A hook that returns a set of actions that can be used to update the state of the form atom. This includes updating fields, submitting, resetting, and validating the form.

#### Arguments

| Name     | Type               | Required? | Description                                                                         |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                               |
| options  | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFormActions<Fields extends FormFields> = {
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
};
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormValues()

A hook that returns the values of the form atom.

#### Arguments

| Name     | Type               | Required? | Description                                                                         |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                               |
| options  | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFormValues<Fields extends FormFields> = FormFieldValues<Fields>;
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormErrors()

A hook that returns the errors of the form atom.

#### Arguments

| Name     | Type               | Required? | Description                                                                         |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                               |
| options  | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFormErrors<Fields extends FormFields> = FormFieldErrors<Fields>;
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormStatus()

A hook that returns the `submitStatus` and `validateStatus` of the form atom.

#### Arguments

| Name     | Type               | Required? | Description                                                                         |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                               |
| options  | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFormStatus = {
  /**
   * The validation status of the form
   */
  validateStatus: ValidateStatus;
  /**
   * The submission status of the form
   */
  submitStatus: SubmitStatus;
};
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormSubmit()

A hook that returns a callback for handling form submission.

#### Arguments

| Name     | Type               | Required? | Description                                                                         |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                               |
| options  | `UseAtomOptions`   | No        | Options that are forwarded to the `useAtom`, `useAtomValue`, and `useSetAtom` hooks |

#### Returns

```ts
type UseFormSubmit<Fields extends FormFields> = {
  (values: (value: FormFieldValues<Fields>) => void | Promise<void>): (
    e?: React.FormEvent<HTMLFormElement>
  ) => void;
};
```

#### [⇗ Back to top](#table-of-contents)

---

## Components

### &lt;Form&gt;

A React component that renders form atoms and their fields in an isolated
scope using a Jotai Provider.

#### Props

| Name      | Type                                                                                 | Required? | Description                                                  |
| --------- | ------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------ |
| atom      | `FormAtom<FormFields>`                                                               | Yes       | A form atom                                                  |
| store     | `AtomStore`                                                                          | No        | [A Jotai store](https://jotai.org/docs/api/core#createstore) |
| component | `React.ComponentType<{state: UseFormState<Value>; actions: UseFormActions<Value>;}>` | No        | A React component to render as the input field               |
| render    | `(state: UseFormState<Value>, actions: UseFormActions<Value>) => JSX.Element`        | No        | A render prop                                                |

#### [⇗ Back to top](#table-of-contents)

---

### &lt;InputField&gt;

A React component that renders field atoms with initial values. This is
most useful for fields that are rendered as native HTML elements because
the props can unpack directly into the underlying component.

#### Props

| Name         | Type                                                                                   | Required? | Description                                                  |
| ------------ | -------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------ |
| atom         | `FieldAtom<Value>`                                                                     | Yes       | A field atom                                                 |
| initialValue | `Value`                                                                                | No        | The initial value of the field                               |
| store        | `AtomStore`                                                                            | No        | [A Jotai store](https://jotai.org/docs/api/core#createstore) |
| component    | `React.ComponentType<{state: UseFieldState<Value>; actions: UseFieldActions<Value>;}>` | No        | A React component to render as the input field               |
| render       | `(state: UseFieldState<Value>, actions: UseFieldActions<Value>) => JSX.Element`        | No        | A render prop                                                |

#### [⇗ Back to top](#table-of-contents)

---

### &lt;Field&gt;

A React component that renders field atoms with initial values. This is
most useful for fields that aren't rendered as native HTML elements.

#### Props

| Name         | Type                                                                                   | Required? | Description                                                  |
| ------------ | -------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------ |
| atom         | `FieldAtom<Value>`                                                                     | Yes       | A field atom                                                 |
| initialValue | `Value`                                                                                | No        | The initial value of the field                               |
| store        | `AtomStore`                                                                            | No        | [A Jotai store](https://jotai.org/docs/api/core#createstore) |
| component    | `React.ComponentType<{state: UseFieldState<Value>; actions: UseFieldActions<Value>;}>` | No        | A React component to render as the field                     |
| render       | `(state: UseFieldState<Value>, actions: UseFieldActions<Value>) => JSX.Element`        | No        | A render prop                                                |

#### [⇗ Back to top](#table-of-contents)

---

## Utilities

### walkFields()

A function that walks through an object containing nested field atoms
and calls a visitor function for each atom it finds.

#### Arguments

| Name    | Type                                                       | Required? | Description                                                                                                    |
| ------- | ---------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| fields  | `FormFields`                                               | Yes       | An object containing nested field atoms                                                                        |
| visitor | `(field: FieldAtom<any>, path: string[]) => void \| false` | Yes       | A function that will be called for each field atom. You can exit early by returning `false` from the function. |

#### Returns

```ts
void
```

#### [⇗ Back to top](#table-of-contents)

---

## Utility types

### FormValues

A utility type for inferring the value types of a form's nested field atoms.

```ts
const nameForm = formAtom({
  name: fieldAtom({ value: "" }),
});

type NameFormValues = FormValues<typeof nameForm>;
```

#### [⇗ Back to top](#table-of-contents)

---

### FormErrors

A utility type for inferring the error types of a form's nested field atoms.

```ts
const nameForm = formAtom({
  name: fieldAtom({ value: "" }),
});

type NameFormErrors = FormErrors<typeof nameForm>;
```

#### [⇗ Back to top](#table-of-contents)

---

## form-atoms/zod

### zodValidate()

Validate your field atoms with Zod schemas. This function validates on every `"user"` and
`"submit"` event, in addition to other events you specify.

[**Check out an example on CodeSandbox**](https://codesandbox.io/s/form-atoms-v2-validate-using-zod-1n1rrr?file=/src/App.tsx)

```ts
import { z } from "zod";
import { formAtom, fieldAtom } from "form-atoms";
import { zodValidate } from "form-atoms/zod";

const schema = z.object({
  name: z.string().min(3),
});

const nameForm = formAtom({
  name: fieldAtom({
    validate: zodValidate(schema.shape.name, {
      on: "submit",
      when: "dirty",
    }),
  }),
});
```

#### Arguments

| Name   | Type                                      | Required? | Description                                          |
| ------ | ----------------------------------------- | --------- | ---------------------------------------------------- |
| schema | `((get: Getter) => z.Schema) \| z.Schema` | Yes       | A Zod schema or a function that returns a Zod schema |
| config | [`ZodValidateConfig`](#zodvalidateconfig) | No        | Configuration options                                |

#### ZodValidateConfig

```ts
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
```

#### [⇗ Back to top](#table-of-contents)

---

## Wait, it's all atoms?

![Wait it's all atoms? Always has been.](https://i.imgflip.com/65s2ci.jpg)

#### [⇗ Back to top](#table-of-contents)

---

## LICENSE

MIT
