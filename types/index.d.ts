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
export declare type FormSubmitStatus = "idle" | "submitting" | "submitted";
export declare type ValidationStatus =
  | "idle"
  | "validating"
  | "valid"
  | "invalid";
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
    reset: WritableAtom<undefined, undefined>;
    validate: WritableAtom<undefined, ValidateOn>;
    submit: WritableAtom<
      undefined,
      (
        values: Record<
          keyof Fields,
          ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
        >
      ) => void | Promise<void>
    >;
  }>;
export declare function useFormAtom<
  Fields extends Record<string, FieldAtom<any>>
>(
  atom: FormAtom<Fields>
): {
  fieldAtoms: Fields extends Promise<infer V> ? V : Fields;
  addField<FieldName extends keyof Fields>(
    fieldName: FieldName,
    atom: Fields[FieldName]
  ): void;
  removeField<FieldName_1 extends keyof Fields>(fieldName: FieldName_1): void;
  validate: (update: ValidateOn) => void;
  reset: (update?: undefined) => void;
};
export declare function useFormErrors<
  Fields extends Record<string, FieldAtom<any>>
>(
  atom: FormAtom<Fields>
): Record<keyof Fields, string[]> extends Promise<infer V>
  ? V
  : Record<keyof Fields, string[]>;
export declare function useFormValues<
  Fields extends Record<string, FieldAtom<any>>
>(
  atom: FormAtom<Fields>
): Record<
  keyof Fields,
  ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
> extends Promise<infer V>
  ? V
  : Record<
      keyof Fields,
      ExtractAtomValue<ExtractAtomValue<Fields[keyof Fields]>["value"]>
    >;
export declare function useFormSubmit<
  Fields extends Record<string, FieldAtom<any>>
>(
  atom: FormAtom<Fields>
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
export declare type ValidateOn = "blur" | "change" | "touch" | "submit";
export declare function useFieldAtom<Value>(
  atom: FieldAtom<Value>,
  scope?: Scope
): UseFieldAtom<Value>;
export interface UseFieldAtom<Value> {
  props: FieldAtomProps<Value>;
  actions: FieldAtomActions<Value>;
  state: FieldAtomState<Value>;
}
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
export declare type Scope = symbol | string | number;
