import { FormEvent } from "react";
import { PathTree, ObserveState } from "projectx.state";
import set from "lodash/set";
import get from "lodash/get";

interface OnSubmit<T> {
  (FormData: FormData<T>): void | Promise<void>;
}

export type DefaultValues = Record<string, any>;

export type DefaultModes = "native" | "change";

export type ChangeMode<M> = DefaultModes | M;

export interface ConstructorParams<T> {
  defaultValues: T;
}

export type InputErrors = Record<string, string | null>;

export type Errors = Record<string, string>;

export interface Commit<M extends string> {
  path: string;
  value: unknown;
  changeMode?: ChangeMode<M>;
}

export interface FormState {
  touchedFields: Record<string, boolean>;
  isSubmitted: boolean;
  isSubmitting: boolean;
}

export interface FormData<V> {
  values: V;
  state: FormState;
  errors: Errors;
}

export interface Details<T, M> {
  prev: T;
  curr: T;
  modes: Map<string, ChangeMode<M>>;
  values: boolean;
}

class Form<T extends DefaultValues, M extends string> extends ObserveState<
  FormData<T>,
  Details<T, M>
> {
  public data: FormData<T>;

  constructor(private readonly options: ConstructorParams<T>) {
    super();

    this.data = {
      values: structuredClone(options.defaultValues),
      state: {
        touchedFields: {},
        isSubmitted: false,
        isSubmitting: false,
      },
      errors: {},
    };
  }

  public get formState() {
    return this.data.state;
  }

  private baseCommit(changes: Commit<M>[]): boolean[] {
    if (!changes.length) {
      return [];
    }

    const changeTree = new PathTree();
    const results: boolean[] = [];
    for (const { path, value } of changes) {
      changeTree.push(path);

      results.push(Boolean(set(this.data, path, value)));
    }

    this.emit({
      changeTree,
      detail: { prev: {} as T, curr: {} as T, modes: new Map(), values: false },
    });

    return results;
  }

  public commit(changes: Commit<M>[]): boolean[] {
    if (!changes.length) {
      return [];
    }

    const changeTree = new PathTree();
    const prev = structuredClone(this.data.values);
    const results: boolean[] = [];
    const modes = new Map<string, ChangeMode<M>>();
    for (const { path, value, changeMode = "change" } of changes) {
      changeTree.push(path);
      modes.set(path, changeMode);
      if (changeMode === "native") {
        this.data.state.touchedFields[path] = true;
      }

      results.push(Boolean(set(this.data.values, path, value)));
    }

    changeTree.push("state.touchedFields");

    this.emit({
      changeTree: PathTree.pushPrefix("values", changeTree),
      detail: { prev, curr: this.data.values, modes, values: true },
    });

    return results;
  }

  private change(values: Partial<FormData<T>>): void {
    const changeTree = new PathTree();
    for (const key in values) {
      changeTree.push(key);

      // @ts-ignore
      this.data[key] = values[key];
    }

    this.emit({
      changeTree,
      detail: { curr: {} as T, prev: {} as T, modes: new Map(), values: false },
    });
  }

  public setErrors(errors: InputErrors): void {
    this.change({
      errors: Object.entries(errors).reduce((acc, [key, error]) => {
        if (error) {
          acc[key] = error;
        } else {
          delete acc[key];
        }

        return acc;
      }, this.data.errors),
    });
  }

  public resetErrors(...paths: string[]): void {
    const errors = this.data.errors;
    for (const path of paths) {
      delete errors[path];
    }

    this.change({ errors: paths.length ? errors : {} });
  }

  public getValues(): T;
  public getValues<T extends Array<T>>(...paths: string[]): T;
  public getValues<T extends Array<T>>(paths: string[]): T;
  public getValues<T extends Record<string, unknown>>(
    path: Record<string, boolean>
  ): T;
  public getValues(...args: unknown[]): any {
    if (!args.length) {
      return this.data.values;
    }

    if (args.length > 1) {
      return (args as string[]).reduce(
        (acc: unknown[], p) => acc.concat(get(this.data.values, p)),
        []
      );
    }

    const [first] = args;
    const type = typeof first;
    if (type === "string") {
      return get(this.data.values, first as string);
    }

    if (!type || type !== "object") {
      throw new Error("Invalid format argument of `getValues` method.");
    }

    if (Array.isArray(first)) {
      return first.reduce(
        (acc: unknown[], p) => acc.concat(get(this.data.values, p)),
        []
      );
    }

    return Object.keys(first as object).reduce(
      (acc, p) => Object.assign(acc, { [p]: get(this.data.values, p) }),
      {}
    );
  }

  public handleSubmit =
    (
      onSubmit: OnSubmit<T>
    ): ((event?: FormEvent<Element> | undefined) => void) =>
    async (event) => {
      event?.preventDefault();

      this.baseCommit([
        { path: "state.isSubmitted", value: true },
        { path: "state.isSubmitting", value: true },
      ]);

      try {
        await onSubmit(this.data);
      } catch (error) {
        console.error(error);
      } finally {
        this.baseCommit([{ path: "state.isSubmitting", value: false }]);
      }
    };

  public reset(): void {
    this.change({
      values: structuredClone(this.options.defaultValues),
      state: {
        touchedFields: {},
        isSubmitted: false,
        isSubmitting: false,
      },
      errors: {},
    });
  }
}

export default Form;
