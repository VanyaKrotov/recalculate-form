import { PathTree } from "projectx.state";
import get from "lodash/get";
import set from "lodash/set";
import has from "lodash/has";

import Form, {
  ChangeMode,
  Commit,
  DefaultValues,
  Details,
  FormState,
} from "./form";

type RecalculateObjectValue<M> = {
  value: unknown;
  mode?: ChangeMode<M>;
};

export interface RecalculateOptions<
  V,
  E extends DefaultValues,
  M extends string
> {
  fields: RecalculateField<V, E, M>[];
  defaultExternal?: Partial<E>;
}

export interface JoinRecalculateResult<E> {
  callExternal(field: keyof E, value: unknown): void;
  callRecalculate(field: string, value?: unknown): void;
  dispose: VoidFunction;
}

type RecalculateValue<M> =
  | RecalculateObjectValue<M>
  | number
  | string
  | boolean;

type RecalculateHandlerResult<T, M> = Partial<
  Record<keyof T, RecalculateValue<M>>
>;

interface RecalculateField<V, E, M> {
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

function getRecalculateResult<M>(
  result: RecalculateValue<M>
): RecalculateObjectValue<M> {
  if (result && typeof result === "object") {
    return result;
  }

  return { value: result, mode: "change" };
}

function createRecalculate<
  T extends object,
  E extends object,
  M extends string
>(
  form: Form<T, M>,
  { defaultExternal = {}, fields }: RecalculateOptions<T, E, M>
): JoinRecalculateResult<E> {
  type Keys = keyof T | keyof E;
  const recalculateMap = fields.reduce(
    (acc, item) => Object.assign(acc, { [item.path]: item }),
    {} as Record<Keys, RecalculateField<T, E, M>>
  );
  let memo = structuredClone(defaultExternal);
  let lastCalledPath: string | undefined;
  const workPromises = new Map<string, Promise<any>>();

  async function handleResult(
    current: unknown,
    prev: unknown,
    { handler, path }: RecalculateField<T, E, M>
  ) {
    const handleResult = handler(current, prev, {
      external: memo as E,
      state: form.data.state,
      values: form.data.values,
      lastCalledPath,
    });

    let result;
    if (handleResult instanceof Promise) {
      workPromises.set(String(path), handleResult);
      result = await handleResult;
      if (workPromises.get(String(path)) !== handleResult) {
        return;
      }
    } else {
      result = handleResult;
    }

    const commits: Commit<M>[] = [];
    for (const path in result) {
      const { value, mode = "change" } = getRecalculateResult<M>(result[path]!);

      commits.push({ path, value, changeMode: mode });
    }

    form.commit(commits);
  }

  async function callExternal(field: keyof E, value: unknown) {
    if (!(field in recalculateMap)) {
      return;
    }

    const options = recalculateMap[field];
    const prev = get(memo, String(field));
    set(memo, String(field), value);

    try {
      await handleResult(value, prev, options);
    } catch {}
  }

  async function callRecalculate(field: string, detail: Details<T, M>) {
    const options = recalculateMap[field as Keys];
    const { watchType = "native" } = options;
    if (watchType !== (detail.modes.get(field) || "change")) {
      return;
    }

    lastCalledPath = field;

    try {
      await handleResult(
        get(detail.curr, field),
        get(detail.prev, field),
        options
      );
    } catch {}
  }

  const entries: [string, PathTree][] = [];
  for (const path in recalculateMap) {
    if (!has(form.data.values, path)) {
      continue;
    }

    entries.push([path, new PathTree([`values.${path}`])]);
  }

  const unsubscribe = form.listen(({ changeTree, detail }) => {
    const entry =
      detail.values && entries.find(([, tree]) => tree.includes(changeTree));
    if (!entry) {
      return;
    }

    callRecalculate(entry[0], detail);
  });

  return {
    callExternal: (path, value) => callExternal(path, value),
    callRecalculate: (path, value) => {
      const options = recalculateMap[path as Keys];
      if (!options) {
        return;
      }

      form.commit([
        {
          path,
          value: value === undefined ? get(form.data.values, path) : value,
          changeMode: options.watchType || "native",
        },
      ]);
    },
    dispose: () => {
      unsubscribe();
      memo = structuredClone(defaultExternal);
      lastCalledPath = undefined;
      workPromises.clear();
    },
  };
}

export { createRecalculate };
