import { FormEvent } from "react";
import { PathTree, Path } from "projectx.state";
import { ObserveState } from "projectx.state/src/modules";

import {
  ChangeMode,
  Commit,
  Details,
  Errors,
  FormConstructor,
  FormConstructorParams,
  FormData,
  FormDefaultValues,
  FormState,
} from "../shared";

class Form<T extends FormDefaultValues, M extends string>
  extends ObserveState<FormData<T>, Details<T, M>>
  implements FormConstructor<T, M>
{
  public data: FormData<T>;

  private getDefaultState(): FormState {
    return {
      dirtyFields: new Set(),
      touchedFields: new Set(),
      isSubmitted: false,
      isSubmitting: false,
    };
  }

  constructor(private readonly options: FormConstructorParams<T>) {
    super();

    this.data = {
      values: structuredClone(options.defaultValues),
      state: this.getDefaultState(),
      errors: {},
    };
  }

  public get formState() {
    return this.data.state;
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

      results.push(Path.set(this.data, path, value));
    }

    this.emit({ changeTree, detail: { prev, curr: this.data.values, modes } });

    return results;
  }

  private change(values: Partial<FormData<T>>): void {
    const changeTree = new PathTree();
    const prev = structuredClone(this.data.values);
    type Key = keyof FormData<T>;
    for (const key in values) {
      changeTree.push(key);

      // @ts-ignore
      this.data[key as Key] = values[key as Key];
    }

    this.emit({
      changeTree,
      detail: { curr: this.data.values, prev, modes: new Map() },
    });
  }

  public setErrors(errors: Errors): void {
    this.commit(
      Object.entries(errors).map(([path, error]) => ({
        path,
        value: error,
        changeMode: "change",
      }))
    );
  }

  public resetError(...paths: string[]): void {
    const errors = this.data.errors;
    for (const path of paths) {
      delete errors[path];
    }

    this.change({ errors });
  }

  public getValues(): T;
  public getValues(paths?: string[]): unknown {
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
      onSubmit: (values: T) => void | Promise<void>
    ): ((event?: FormEvent<Element> | undefined) => void) =>
    async (event) => {
      event?.preventDefault();

      this.commit([
        { path: "state.isSubmitted", value: true },
        { path: "state.isSubmitting", value: true },
      ]);

      try {
        await onSubmit(this.data.values);
      } catch (error) {
        console.error(error);
      } finally {
        this.commit([{ path: "state.isSubmitting", value: false }]);
      }
    };

  public reset(): void {
    this.change({
      values: structuredClone(this.options.defaultValues),
      state: this.getDefaultState(),
      errors: {},
    });
  }
}

export default Form;
