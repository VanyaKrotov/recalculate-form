import { CommitChange, ObserveStateInstance } from "projectx.state";
import { ChangeEventHandler, FormEvent } from "react";

export type DefaultModes = "native" | "change";

export type FormDefaultValues = Record<string, any>;

export interface FormState {
  touchedFields: Set<string>;
  isSubmitted: boolean;
  isSubmitting: boolean;
}

export interface FormData<V> {
  values: V;
  state: FormState;
  errors: Errors;
}

export type RecalculateObjectValue<M> = {
  value: unknown;
  mode?: ChangeMode<M>;
};

export type RecalculateValue<M> =
  | RecalculateObjectValue<M>
  | number
  | string
  | boolean;

export type RecalculateHandlerResult<T, M> = Partial<
  Record<keyof T, RecalculateValue<M>>
>;

export interface RecalculateField<V, E, M> {
  path: keyof V | keyof E;
  watchType?: ChangeMode<M>;
  handler(
    current: unknown,
    prev: unknown,
    rest: {
      values: V;
      state: FormState;
      external: E;
      lastCalledPath?: string;
    }
  ): RecalculateHandlerResult<V, M> | Promise<RecalculateHandlerResult<V, M>>;
}

export interface RecalculateOptions<
  V,
  E extends FormDefaultValues,
  M extends string
> {
  fields: RecalculateField<V, E, M>[];
  defaultExternal?: Partial<E>;
}

export interface ValidateCallback<T extends FormDefaultValues> {
  (values: T, errors: Errors): Errors | Promise<Errors>;
}

export interface JoinRecalculateResult<E> {
  callExternal(field: keyof E, value: unknown): void;
  callRecalculate(field: string, value?: unknown): void;
  dispose: VoidFunction;
}

export type ChangeMode<M> = DefaultModes | M;

export interface Details<T, M> {
  prev: T;
  curr: T;
  modes: Map<string, ChangeMode<M>>;
  values: boolean;
}

export type Errors = Record<string, string>;

export interface Commit<M extends string> extends CommitChange {
  changeMode?: ChangeMode<M>;
}

export interface OnSubmit<T> {
  (FormData: FormData<T>): void | Promise<void>;
}

export interface FormConstructor<T extends FormDefaultValues, M extends string>
  extends ObserveStateInstance<FormData<T>, Details<T, M>> {
  getValues(): T;
  getValues<T extends Array<T>>(...paths: string[]): T;
  getValues<T extends Record<string, unknown>>(
    path: Record<string, boolean>
  ): T;
  getValues<T extends Array<T>>(paths: string[]): T;
  setErrors(errors: Errors): void;
  resetError(...paths: string[]): void;
  reset(): void;
  commit(changes: Commit<ChangeMode<M>>[]): boolean[];
  handleSubmit(onSubmit: OnSubmit<T>): (event?: FormEvent) => void;
}

export interface FormConstructorParams<T> {
  defaultValues: T;
}

export interface UseFieldResult<T> {
  change: (value: T) => void;
  fieldState: {
    isTouched: boolean;
    error: string | null;
  };
  input: {
    name: string;
    value?: T;
    onChange: ChangeEventHandler<HTMLInputElement>;
  };
}
