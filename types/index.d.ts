import type {
  Atom,
  ExtractAtomUpdate,
  ExtractAtomValue,
  Getter,
  WritableAtom,
} from "jotai";
import { RESET } from "jotai/utils";
import * as React from "react";
export declare function formAtom<Fields extends FieldAtom<any>[]>(
  fields: Fields
): Atom<Atom<FieldAtom<any>>[]>;
export declare function useSubmitForm<Fields extends FieldAtom<any>[]>(
  formAtom: Atom<Fields>
): void;
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
  errors: WritableAtom<string[], ValidateOn>;
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
}>;
export declare type ValidateOn = "blur" | "change" | "submit";
export declare function useFormAtom(atom: ReturnType<typeof formAtom>): void;
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
    value: ExtractAtomUpdate<ExtractAtomValue<FieldAtom<Value>>["errors"]>
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
