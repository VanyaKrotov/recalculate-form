import { CommitChange, ObserveStateInstance } from "projectx.state";
import { ChangeEventHandler, FormEvent } from "react";

export type DefaultModes = "native" | "change";

export type FormDefaultValues = Record<string, any>;

export interface FormState {
  dirtyFields: Set<string>;
  touchedFields: Set<string>;
  isSubmitted: boolean;
  isSubmitting: boolean;
}

export interface FormData<V> {
  values: V;
  state: FormState;
  errors: Errors;
}

export type RecalculateHandlerResult<T, M> = Partial<
  Record<
    keyof T,
    { value: unknown; mode?: ChangeMode<M> } | number | string | boolean
  >
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
  defaultExternal: Partial<E>;
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
}

export type Errors = Record<string, string>;

export interface Commit<M extends string> extends CommitChange {
  changeMode?: ChangeMode<M>;
}

export interface FormConstructor<T extends FormDefaultValues, M extends string>
  extends ObserveStateInstance<FormData<T>, Details<T, M>> {
  get formState(): FormState;
  getValues(): T;
  getValues<T>(paths: string[]): T;
  setErrors(errors: Errors): void;
  resetError(...paths: string[]): void;
  reset(): void;
  commit(changes: Commit<ChangeMode<M>>[]): boolean[];
  handleSubmit(
    onSubmit: (values: T) => void | Promise<void>
  ): (event?: FormEvent) => void;
}

export interface FormConstructorParams<T> {
  defaultValues: T;
}

export interface UseFieldResult<T> {
  change: <T>(value: T) => void;
  fieldState: {
    isDirty: boolean;
    isTouched: boolean;
  };
  error: string | null;
  input: {
    name: string;
    value: T;
    onChange: ChangeEventHandler<HTMLInputElement>;
  };
}
