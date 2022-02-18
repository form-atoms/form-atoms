<hr/>

# form-atoms

> Form atom primitives for [Jotai](https://jotai.org/docs/api/core)

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
    <img alt="Build status" src="https://img.shields.io/github/workflow/status/jaredLunde/form-atoms/release/main?style=for-the-badge&labelColor=24292e">
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
- [x] **Hooks only**, no components
- [x] **Async field-level validation**
- [x] **Async submission**

## Quick start

[Check out the example on CodeSandbox](https://codesandbox.io/s/getting-started-with-form-atoms-ddhgq2?file=/src/App.tsx)

```js
import { fieldAtom, useFieldAtom, formAtom, useFormAtom } from "form-atoms";

const nameFormAtom = formAtom({
  name: {
    first: fieldAtom({ value: "" }),
    last: fieldAtom({ value: "" }),
  },
});

function Form() {
  const { fieldAtoms, submit } = useFormAtom(nameFormAtom);
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
  const field = useFieldAtom(atom);
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

| Field atoms                                   | Description                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`fieldAtom`](#fieldatom)                     | An atom that represents a field in a form. It manages state for the field, including the name, value, errors, dirty, validation, and touched state.                      |
| [`useFieldAtom`](#usefieldatom)               | A hook that returns `props`, `state`, and `actions` of a field atom from `useFieldAtomProps`, `useFieldAtomState`, and `useFieldAtomActions`.                            |
| [`useFieldAtomProps`](#usefieldatomprops)     | A hook that returns a set of props that can be destructured directly into an `<input>`, `<select>`, or `<textarea>` element.                                             |
| [`useFieldAtomState`](#usefieldatomstate)     | A hook that returns the state of a field atom. This includes the field's value, whether it has been touched, whether it is dirty, the validation status, and any errors. |
| [`useFieldAtomActions`](#usefieldatomactions) | A hook that returns a set of actions that can be used to interact with the field atom state.                                                                             |
| [`useFieldAtomValue`](#usefieldatomvalue)     | A hook that returns the value of a field atom.                                                                                                                           |
| [`useFieldAtomErrors`](#usefieldatomerrors)   | A hook that returns the errors of a field atom.                                                                                                                          |

| Form atoms                                  | Description                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`formAtom`](#formatom)                     | An atom that derives its state fields atoms and allows you to submit, validate, and reset your form.                                                                                                                                                                                                                      |
| [`useFormAtom`](#useformatom)               | A hook that returns an object that contains the `fieldAtoms` and actions to validate, submit, and reset the form.                                                                                                                                                                                                         |
| [`useFormAtomState`](#useformatomstate)     | A hook that returns the primary state of the form atom including values, errors, submit and validation status, as well as the `fieldAtoms`. Note that this hook will cuase its parent component to re-render any time those states change, so it can be useful to use more targeted state hooks like `useFormAtomStatus`. |
| [`useFormAtomActions`](#useformatomactions) | A hook that returns a set of actions that can be used to update the state of the form atom. This includes updating fields, submitting, resetting, and validating the form.                                                                                                                                                |
| [`useFieldAtomValues`](#useformatomvalues)  | A hook that returns the values of the form atom.                                                                                                                                                                                                                                                                          |
| [`useFieldAtomErrors`](#useformatomerrors)  | A hook that returns the errors of the form atom.                                                                                                                                                                                                                                                                          |
| [`useFieldAtomStatus`](#useformatomstatus)  | A hook that returns the `submitStatus` and `validateStatus` of the form atom.                                                                                                                                                                                                                                             |
| [`useFieldAtomSubmit`](#useformatomsubmit)  | A hook that returns a callback for handling form submission.                                                                                                                                                                                                                                                              |

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
interface FieldAtomConfig<Value> {
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
```

#### Returns

```ts
type FieldAtom<Value> = Atom<{
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldAtom()

A hook that returns `props`, `state`, and `actions` of a field atom from
[`useFieldAtomProps`](#usefieldatomprops), [`useFieldAtomState`](#usefieldatomstate),
and [`useFieldAtomActions`](#usefieldatomactions).

#### Arguments

| Name      | Type               | Required? | Description                                                             |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                  |
| scope     | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
interface UseFieldAtom<Value> {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldAtomProps()

A hook that returns a set of props that can be destructured directly into an `<input>`, `<select>`, or `<textarea>` element.

#### Arguments

| Name      | Type               | Required? | Description                                                             |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                  |
| scope     | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
interface FieldAtomProps<Value> {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldAtomState()

A hook that returns the state of a field atom. This includes the field's value, whether it has been touched, whether it is dirty, the validation status, and any errors.

#### Arguments

| Name      | Type               | Required? | Description                                                             |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                  |
| scope     | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
interface FieldAtomState<Value> {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldAtomActions()

A hook that returns a set of actions that can be used to interact with the field atom state.

#### Arguments

| Name      | Type               | Required? | Description                                                             |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                  |
| scope     | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
interface FieldAtomActions<Value> {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldAtomValue()

A hook that returns the value of a field atom.

#### Arguments

| Name      | Type               | Required? | Description                                                             |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                  |
| scope     | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
typeof value;
```

#### [⇗ Back to top](#table-of-contents)

---

### useFieldAtomErrors()

A hook that returns the errors of a field atom.

#### Arguments

| Name      | Type               | Required? | Description                                                             |
| --------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| fieldAtom | `FieldAtom<Value>` | Yes       | The atom that stores the field's state                                  |
| scope     | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
string[]
```

#### [⇗ Back to top](#table-of-contents)

---

## Form atoms

### formAtom()

An atom that derives its state fields atoms and allows you to submit,
validate, and reset your form.

#### Arguments

| Name   | Type                                | Required? | Description                                                                                                          |
| ------ | ----------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| fields | [`FormAtomFields`](#formatomfields) | Yes       | An object containing field atoms to be included in the form. Field atoms can be deeply nested in objects and arrays. |

#### `FormAtomFields`

```ts
type FormAtomFields = {
  [key: string | number]:
    | FieldAtom<any>
    | FormAtomFields
    | FormAtomFields[]
    | FieldAtom<any>[];
};
```

#### Returns

```ts
type FormAtom<Fields extends FormAtomFields> = Atom<{
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormAtom()

A hook that returns an object that contains the `fieldAtoms` and actions to validate, submit, and reset the form.

#### Arguments

| Name     | Type               | Required? | Description                                                             |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                   |
| scope    | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
interface UseFormAtom<Fields extends FormAtomFields> {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormAtomState()

A hook that returns the primary state of the form atom including values, errors, submit and validation status, as well as the `fieldAtoms`. Note that this hook will cuase its parent component to re-render any time those states change, so it can be useful to use more targeted state hooks like `useFormAtomStatus`.

#### Arguments

| Name     | Type               | Required? | Description                                                             |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                   |
| scope    | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
interface FormAtomState<Fields extends FormAtomFields> {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormAtomActions()

A hook that returns a set of actions that can be used to update the state of the form atom. This includes updating fields, submitting, resetting, and validating the form.

#### Arguments

| Name     | Type               | Required? | Description                                                             |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                   |
| scope    | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
interface FormAtomActions<Fields extends FormAtomFields> {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormAtomValues()

A hook that returns the values of the form atom.

#### Arguments

| Name     | Type               | Required? | Description                                                             |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                   |
| scope    | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
type FormAtomValues<Fields extends FormAtomFields> = {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormAtomErrors()

A hook that returns the errors of the form atom.

#### Arguments

| Name     | Type               | Required? | Description                                                             |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                   |
| scope    | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
type FormAtomErrors<Fields extends FormAtomFields> = {
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
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormAtomStatus()

A hook that returns the `submitStatus` and `validateStatus` of the form atom.

#### Arguments

| Name     | Type               | Required? | Description                                                             |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                   |
| scope    | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
interface FormAtomStatus {
  /**
   * The validation status of the form
   */
  validateStatus: FormAtomValidateStatus;
  /**
   * The submission status of the form
   */
  submitStatus: FormAtomSubmitStatus;
}
```

#### [⇗ Back to top](#table-of-contents)

---

### useFormAtomSubmit()

A hook that returns a callback for handling form submission.

#### Arguments

| Name     | Type               | Required? | Description                                                             |
| -------- | ------------------ | --------- | ----------------------------------------------------------------------- |
| formAtom | `FormAtom<Fields>` | Yes       | The atom that stores the form's state                                   |
| scope    | `Scope`            | No        | [A Jotai scope](https://twitter.com/dai_shi/status/1383784883147874310) |

#### Returns

```ts
(values: FormAtomValues) => (e?: React.FormEvent<HTMLFormElement>) => void | Promise<void>
```

#### [⇗ Back to top](#table-of-contents)

---

### walkFields()

A function that walks through an object containing nested field atoms
and calls a visitor function for each atom it finds.

#### Arguments

| Name    | Type                                                       | Required? | Description                                                                                                    |
| ------- | ---------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| fields  | `FormAtomFields`                                           | Yes       | An object containing nested field atoms                                                                        |
| visitor | `(field: FieldAtom<any>, path: string[]) => void \| false` | Yes       | A function that will be called for each field atom. You can exit early by returning `false` from the function. |

#### Returns

```ts
void
```

#### [⇗ Back to top](#table-of-contents)

---

## Wait, it's all atoms?

![Wait it's all atoms? Always has been.](https://i.imgflip.com/65s2ci.jpg)

#### [⇗ Back to top](#table-of-contents)

---

## LICENSE

MIT
