import type { Atom, ExtractAtomUpdate, ExtractAtomValue, Getter, WritableAtom } from "jotai";
import { RESET } from "jotai/utils";
import * as React from "react";
/**
 * A React component that renders form atoms and their fields in an isolated
 * scope using a Jotai Provider.
 *
 * @param {FormProps<Fields>} props - Component props
 */
export declare function Form<Fields extends FormAtomFields>(props: FormProps<Fields>): JSX.Element;
/**
 * A React component that renders field atoms with initial values. This is
 * most useful for fields that are rendered as native HTML elements because
 * the props can unpack directly into the underlying component.
 *
 * @param {FieldProps<Value>} props - Component props
 */
export declare function InputField<Value extends string | number | string[]>(props: InputFieldProps<Value>): JSX.Element;
/**
 * A React component that renders field atoms with initial values. This is
 * most useful for fields that aren't rendered as native HTML elements.
 *
 * @param {FieldProps<Value>} props - Component props
 */
export declare function Field<Value extends string | number | string[]>(props: FieldProps<Value>): JSX.Element;
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
export declare function formAtom<Fields extends FormAtomFields>(fields: Fields): FormAtom<Fields>;
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
export declare function useFormAtom<Fields extends FormAtomFields>(formAtom: FormAtom<Fields>, scope?: Scope): UseFormAtom<Fields>;
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
export declare function useFormAtomState<Fields extends FormAtomFields>(formAtom: FormAtom<Fields>, scope?: Scope): FormAtomState<Fields>;
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
export declare function useFormAtomActions<Fields extends FormAtomFields>(formAtom: FormAtom<Fields>, scope?: Scope): FormAtomActions<Fields>;
/**
 * A hook that returns the errors of the form atom.
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form data.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The errors of the form.
 */
export declare function useFormAtomErrors<Fields extends FormAtomFields>(formAtom: FormAtom<Fields>, scope?: Scope): FormAtomErrors<Fields> extends Promise<infer V> ? V : FormAtomErrors<Fields>;
/**
 * A hook that returns the values of the form atom
 *
 * @param {FormAtom<FormAtomFields>} formAtom - The atom that stores the form state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The values of the form.
 */
export declare function useFormAtomValues<Fields extends FormAtomFields>(formAtom: FormAtom<Fields>, scope?: Scope): FormAtomValues<Fields> extends Promise<infer V> ? V : FormAtomValues<Fields>;
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
export declare function useFormAtomStatus<Fields extends FormAtomFields>(formAtom: FormAtom<Fields>, scope?: Scope): FormAtomStatus;
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
export declare function useFormAtomSubmit<Fields extends FormAtomFields>(formAtom: FormAtom<Fields>, scope?: Scope): (values: (values: FormAtomValues<Fields>) => void | Promise<void>) => (e?: React.FormEvent<HTMLFormElement> | undefined) => void;
/**
 * An atom that represents a field in a form. It manages state for the field,
 * including the name, value, errors, dirty, validation, and touched state.
 *
 * @param {FieldAtomConfig<Value>} config - The initial state and configuration of the field.
 * @returns A FieldAtom.
 */
export declare function fieldAtom<Value>(config: FieldAtomConfig<Value>): FieldAtom<Value>;
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
export declare function useFieldAtomActions<Value>(fieldAtom: FieldAtom<Value>, scope?: Scope): FieldAtomActions<Value>;
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
export declare function useFieldAtomProps<Value extends string | number | readonly string[]>(fieldAtom: FieldAtom<string | number | readonly string[]>, scope?: Scope): FieldAtomProps<Value>;
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
export declare function useFieldAtomState<Value>(fieldAtom: FieldAtom<Value>, scope?: Scope): FieldAtomState<Value>;
/**
 * A hook that returns the value of a field atom.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The value of the field atom.
 */
export declare function useFieldAtomValue<Value>(fieldAtom: FieldAtom<Value>, scope?: Scope): Value extends Promise<infer V> ? V : Value;
/**
 * A hook that returns the errors of a field atom.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that stores the field's state.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 * @returns The errors of the field atom.
 */
export declare function useFieldAtomErrors<Value>(fieldAtom: FieldAtom<Value>, scope?: Scope): string[];
/**
 * Sets the initial value of a field atom. Initial values can only be set once
 * per scope. Therefore, if the initial value used is changed during rerenders,
 * it won't update the atom value.
 *
 * @param {FieldAtom<any>} fieldAtom - The atom that you want to use to store the value.
 * @param {Value} initialValue - The initial value of the field.
 * @param {Scope} scope - When using atoms with a scope, the provider with
 *   the same scope will be used. The recommendation for the scope value is
 *   a unique symbol. The primary use case of scope is for library usage.
 */
export declare function useFieldAtomInitialValue<Value>(fieldAtom: FieldAtom<Value>, initialValue?: Value, scope?: Scope): void;
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
export declare function useFieldAtom<Value extends string | number | readonly string[]>(fieldAtom: FieldAtom<Value>, scope?: Scope): UseFieldAtom<Value>;
/**
 * A function that walks through an object containing nested field atoms
 * and calls a visitor function for each atom it finds.
 *
 * @param {FormAtomFields} fields - An object containing nested field atoms
 * @param visitor - A function that will be called for each field atom. You can
 *  exit early by returning `false` from the function.
 * @param path - The base path of the field atom.
 */
export declare function walkFields<Fields extends FormAtomFields>(fields: Fields, visitor: (field: FieldAtom<any>, path: string[]) => void | false, path?: string[]): void;
export { Provider } from "jotai";
export declare type InputFieldProps<Value extends string | number | string[]> = {
    /**
     * A field atom
     */
    atom: FieldAtom<Value>;
    /**
     * The initial value of the field
     */
    initialValue?: Value;
    /**
     * When using atoms with a scope, the provider with the same scope will be used.
     * The recommendation for the scope value is a unique symbol. The primary use case
     * of scope is for library usage.
     */
    scope?: Scope;
    /**
     * A render prop
     *
     * @param props - Props that can be directly unpacked into a native HTML input element
     * @param state - The state of the field atom
     * @param actions - The actions of the field atom
     */
    render(props: FieldAtomProps<Value>, state: FieldAtomState<Value>, actions: FieldAtomActions<Value>): JSX.Element;
} | {
    /**
     * A field atom
     */
    atom: FieldAtom<Value>;
    /**
     * The initial value of the field
     */
    initialValue?: Value;
    /**
     * When using atoms with a scope, the provider with the same scope will be used.
     * The recommendation for the scope value is a unique symbol. The primary use case
     * of scope is for library usage.
     */
    scope?: Scope;
    /**
     * A React component
     */
    component: "input" | "textarea" | "select" | React.ComponentType<FieldAtomProps<Value>>;
};
export declare type FieldProps<Value extends string | number | string[]> = {
    /**
     * A field atom
     */
    atom: FieldAtom<Value>;
    /**
     * The initial value of the field
     */
    initialValue?: Value;
    /**
     * When using atoms with a scope, the provider with the same scope will be used.
     * The recommendation for the scope value is a unique symbol. The primary use case
     * of scope is for library usage.
     */
    scope?: Scope;
    /**
     * A render prop
     *
     * @param state - The state of the field atom
     * @param actions - The actions of the field atom
     */
    render(state: FieldAtomState<Value>, actions: FieldAtomActions<Value>): JSX.Element;
} | {
    /**
     * A field atom
     */
    atom: FieldAtom<Value>;
    /**
     * The initial value of the field
     */
    initialValue?: Value;
    /**
     * When using atoms with a scope, the provider with the same scope will be used.
     * The recommendation for the scope value is a unique symbol. The primary use case
     * of scope is for library usage.
     */
    scope?: Scope;
    /**
     * A React component
     */
    component: React.ComponentType<{
        state: FieldAtomState<Value>;
        actions: FieldAtomActions<Value>;
    }>;
};
export declare type FormProps<Fields extends FormAtomFields> = {
    /**
     * A form atom
     */
    atom: FormAtom<Fields>;
    /**
     * When using atoms with a scope, the provider with the same scope will be used.
     * The recommendation for the scope value is a unique symbol. The primary use case
     * of scope is for library usage.
     */
    scope?: Scope;
    /**
     * A render prop
     *
     * @param props - Props returned from a `useFormAtom` hook
     */
    render(props: UseFormAtom<Fields>): JSX.Element;
} | {
    /**
     * A form atom
     */
    atom: FormAtom<Fields>;
    /**
     * When using atoms with a scope, the provider with the same scope will be used.
     * The recommendation for the scope value is a unique symbol. The primary use case
     * of scope is for library usage.
     */
    scope?: Scope;
    /**
     * A React component.
     */
    component: React.ComponentType<UseFormAtom<Fields>>;
};
/**
 * A form submission status
 */
export declare type FormAtomSubmitStatus = "idle" | "submitting" | "submitted";
/**
 * A form and field validation status
 */
export declare type FormAtomValidateStatus = "validating" | "valid" | "invalid";
/**
 * Event types that a field atom may validate against
 */
export declare type FieldAtomValidateOn = "user" | "blur" | "change" | "touch" | "submit";
export declare type FieldAtom<Value> = Atom<{
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
    touched: WritableAtom<boolean, boolean | typeof RESET | ((prev: boolean) => boolean)>;
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
    ref: WritableAtom<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null | ((value: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) => HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)>;
    _validateCount: WritableAtom<number, number | ((current: number) => number)>;
    _validateCallback?: FieldAtomConfig<Value>["validate"];
}>;
export declare type FormAtom<Fields extends FormAtomFields> = Atom<{
    /**
     * An atom containing an object of nested field atoms
     */
    fields: WritableAtom<Fields, Fields | typeof RESET | ((prev: Fields) => Fields), void>;
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
     * A read-only atom that returns `true` if any of the fields in
     * the form are dirty.
     */
    dirty: Atom<boolean>;
    /**
     * A read-only atom derives the touched state of its nested field atoms.
     */
    touchedFields: Atom<FormAtomTouchedFields<Fields>>;
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
    submit: WritableAtom<null, (values: FormAtomValues<Fields>) => void | Promise<void>>;
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
export declare type FormAtomFields = {
    [key: string | number]: FieldAtom<any> | FormAtomFields | FormAtomFields[] | FieldAtom<any>[];
};
/**
 * An object containing the values of a form's nested field atoms
 */
export declare type FormAtomValues<Fields extends FormAtomFields> = {
    [Key in keyof Fields]: Fields[Key] extends FieldAtom<infer Value> ? Value : Fields[Key] extends FormAtomFields ? FormAtomValues<Fields[Key]> : Fields[Key] extends any[] ? FormAtomValues<{
        [Index in Extract<keyof Fields[Key], number>]: Fields[Key][Index];
    }> : never;
};
/**
 * An object containing the errors of a form's nested field atoms
 */
export declare type FormAtomErrors<Fields extends FormAtomFields> = {
    [Key in keyof Fields]: Fields[Key] extends FieldAtom<any> ? string[] : Fields[Key] extends FormAtomFields ? FormAtomErrors<Fields[Key]> : Fields[Key] extends any[] ? FormAtomErrors<{
        [Index in Extract<keyof Fields[Key], number>]: Fields[Key][Index];
    }> : never;
};
export declare type FormAtomTouchedFields<Fields extends FormAtomFields> = {
    [Key in keyof Fields]: Fields[Key] extends FieldAtom<any> ? boolean : Fields[Key] extends FormAtomFields ? FormAtomValues<Fields[Key]> : Fields[Key] extends any[] ? FormAtomValues<{
        [Index in Extract<keyof Fields[Key], number>]: Fields[Key][Index];
    }> : never;
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
    submit(handleSubmit: (values: Parameters<ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["submit"]>>[0]) => void | Promise<void>): (e?: React.FormEvent<HTMLFormElement>) => void;
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
    values: FormAtomValues<Fields>;
    /**
     * An object containing the errors of a form's nested field atoms
     */
    errors: FormAtomErrors<Fields>;
    /**
     * `true` if any of the fields in the form are dirty.
     */
    dirty: boolean;
    /**
     * An object containing the touched state of the form's nested field atoms.
     */
    touchedFields: FormAtomTouchedFields<Fields>;
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
    updateFields(fields: ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["fields"]>): void;
    /**
     * A function for handling form submissions.
     *
     * @param handleSubmit - A function that is called with the form's values
     *   when the form is submitted
     */
    submit(handleSubmit: (values: Parameters<ExtractAtomUpdate<ExtractAtomValue<FormAtom<Fields>>["submit"]>>[0]) => void | Promise<void>): (e?: React.FormEvent<HTMLFormElement>) => void;
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
    ref: React.RefCallback<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
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
    setValue(value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["value"]>): void;
    /**
     * A function for changing the touched state of a field. This will trigger a
     * `"touch"` validation event.
     *
     * @param {boolean} touched - The new touched state of the field
     */
    setTouched(touched: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["touched"]>): void;
    /**
     * A function for changing the error state of a field
     *
     * @param {string[]} errors - The new error state of the field
     */
    setErrors(errors: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["errors"]>): void;
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
    validateStatus: ExtractAtomValue<ExtractAtomValue<FieldAtom<Value>>["validateStatus"]>;
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
export declare type Scope = symbol | string | number;
