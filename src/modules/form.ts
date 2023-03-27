import { FormEvent } from "react";
import { PathTree, Path, ObserveState } from "projectx.state";

import {
  ChangeMode,
  Commit,
  Details,
  Errors,
  FormConstructor,
  FormConstructorParams,
  FormData,
  FormDefaultValues,
  OnSubmit,
} from "../shared";

class Form<T extends FormDefaultValues, M extends string>
  extends ObserveState<FormData<T>, Details<T, M>>
  implements FormConstructor<T, M>
{
  public data: FormData<T>;

  constructor(private readonly options: FormConstructorParams<T>) {
    super();

    this.data = {
      values: structuredClone(options.defaultValues),
      state: {
        touchedFields: new Set(),
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

      results.push(Path.set(this.data, path, value));
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
        this.data.state.touchedFields.add(path);
      }

      results.push(Path.set(this.data.values, path, value));
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

  public setErrors(errors: Errors): void {
    this.change({
      errors: Object.assign(this.data.errors, errors),
    });
  }

  public resetError(...paths: string[]): void {
    const errors = this.data.errors;
    for (const path of paths) {
      delete errors[path];
    }

    this.change({ errors: paths.length ? errors : {} });
  }

  public getValues(): T;
  public getValues(...paths: string[]): unknown {
    if (!paths?.length) {
      return this.data.values;
    }

    return paths.reduce(
      (acc, path) =>
        Object.assign(acc, { [path]: Path.get(this.data.values, path) }),
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
        touchedFields: new Set(),
        isSubmitted: false,
        isSubmitting: false,
      },
      errors: {},
    });
  }
}

export default Form;
