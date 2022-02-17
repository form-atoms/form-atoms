import type {
  Atom,
  ExtractAtomUpdate,
  ExtractAtomValue,
  Getter,
  WritableAtom,
} from "jotai";
import { RESET } from "jotai/utils";
import * as React from "react";
export declare function formAtom<Fields extends Record<string, FieldAtom<any>>>(
  fields: Fields
): FormAtom<Fields>;
export declare function useFormAtom<
  Fields extends Record<string, FieldAtom<any>>
>(formAtom: FormAtom<Fields>, scope?: Scope): UseFormAtom<Fields>;
export declare function useFormAtomState<
  Fields extends Record<string, FieldAtom<any>>
>(formAtom: FormAtom<Fields>, scope?: Scope): FormAtomState<Fields>;
export declare function useFormAtomActions<
  Fields extends Record<string, FieldAtom<any>>
>(formAtom: FormAtom<Fields>, scope?: Scope): FormAtomActions<Fields>;
export declare function useFormAtomErrors<
  Fields extends Record<string, FieldAtom<any>>
>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): Record<keyof Fields, string[]> extends Promise<infer V>
  ? V
  : Record<keyof Fields, string[]>;
export declare function useFormAtomValues<
  Fields extends Record<string, FieldAtom<any>>
>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): Record<
  keyof Fields,
  ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
> extends Promise<infer V>
  ? V
  : Record<
      keyof Fields,
      ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
    >;
export declare function useFormAtomSubmit<
  Fields extends Record<string, FieldAtom<any>>
>(
  formAtom: FormAtom<Fields>,
  scope?: Scope
): (
  values: (
    values: Record<
      keyof Fields,
      ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
    >
  ) => void | Promise<void>
) => (e?: React.FormEvent<HTMLFormElement> | undefined) => void;
export declare function fieldAtom<Value>(
  config: FieldAtomConfig<Value>
): FieldAtom<Value>;
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
export declare function useFieldAtomActions<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): FieldAtomActions<Value>;
export declare function useFieldAtomProps<Value>(
  fieldAtom: FieldAtom<Value>,
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
export declare function useFieldAtom<Value>(
  fieldAtom: FieldAtom<Value>,
  scope?: Scope
): UseFieldAtom<Value>;
export declare type FormAtomSubmitStatus = "idle" | "submitting" | "submitted";
export declare type FormAtomValidateStatus =
  | "idle"
  | "validating"
  | "valid"
  | "invalid";
export declare type FieldAtomValidateOn =
  | "user"
  | "blur"
  | "change"
  | "touch"
  | "submit";
export declare type FormAtom<Fields extends Record<string, FieldAtom<any>>> =
  Atom<{
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
    reset: WritableAtom<null, void>;
    validate: WritableAtom<null, void | FieldAtomValidateOn>;
    validateStatus: WritableAtom<
      FormAtomValidateStatus,
      FormAtomValidateStatus
    >;
    submit: WritableAtom<
      null,
      (
        values: Record<
          keyof Fields,
          ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
        >
      ) => void | Promise<void>
    >;
    submitCount: Atom<number>;
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
  validate(): void;
  reset(): void;
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
