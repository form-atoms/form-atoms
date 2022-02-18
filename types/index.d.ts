import type {
  Atom,
  ExtractAtomUpdate,
  ExtractAtomValue,
  Getter,
  WritableAtom,
} from "jotai";
import { RESET } from "jotai/utils";
import * as React from "react";
export declare function formAtom<Fields extends FormAtomFields>(
  fields: Fields
): FormAtom<Fields>;
export declare function useFormAtom<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): UseFormAtom<Fields>;
export declare function useFormAtomState<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomState<Fields>;
export declare function useFormAtomActions<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomActions<Fields>;
export declare function useFormAtomErrors<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomErrors<Fields> extends Promise<infer V> ? V : FormAtomErrors<Fields>;
export declare function useFormAtomValues<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomValues<Fields> extends Promise<infer V> ? V : FormAtomValues<Fields>;
export declare function useFormAtomStatus<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): FormAtomStatus;
export declare function useFormAtomSubmit<Fields extends FormAtomFields>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): (
  values: (values: FormAtomValues<Fields>) => void | Promise<void>
) => (e?: React.FormEvent<HTMLFormElement> | undefined) => void;
export declare function fieldAtom<Value>(
  config: FieldAtomConfig<Value>
): FieldAtom<Value>;
export declare function useFieldAtomActions<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomActions<Value>;
export declare function useFieldAtomProps<
  Value extends string | number | readonly string[]
>(
  fieldAtom: FieldAtom<string | number | readonly string[]>,
  scope?: Scope
): FieldAtomProps<Value>;
export declare function useFieldAtomState<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomState<Value>;
export declare function useFieldAtomValue<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): Value extends Promise<infer V> ? V : Value;
export declare function useFieldAtomErrors<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): string[];
export declare function useFieldAtom<
  Value extends string | number | readonly string[]
>(fieldAtom: FieldAtom<Value>, scope?: Scope): UseFieldAtom<Value>;
export { Provider } from "jotai";
export declare type FormAtomSubmitStatus = "idle" | "submitting" | "submitted";
export declare type FormAtomValidateStatus = "validating" | "valid" | "invalid";
export declare type FieldAtomValidateOn =
  | "user"
  | "blur"
  | "change"
  | "touch"
  | "submit";
export declare type FieldAtom<Value> = Atom<{
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
export declare type FormAtom<Fields extends FormAtomFields> = Atom<{
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
export declare type FormAtomFields = {
  [key: string | number]:
    | FieldAtom<any>
    | FormAtomFields
    | FormAtomFields[]
    | FieldAtom<any>[];
};
export declare type FormAtomValues<Fields extends FormAtomFields> = {
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<infer Value>
    ? Value
    : FormAtomValues<Fields[Key]>;
};
export declare type FormAtomErrors<Fields extends FormAtomFields> = {
  [Key in keyof Fields]: Fields[Key] extends FieldAtom<any>
    ? string[]
    : FormAtomValues<Fields[Key]>;
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
export declare type Scope = symbol | string | number;
