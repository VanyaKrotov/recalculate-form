import { Path, PathTree } from "projectx.state";

import {
  ChangeMode,
  Commit,
  Details,
  FormConstructor,
  JoinRecalculateResult,
  RecalculateField,
  RecalculateOptions,
} from "../shared";

function createRecalculate<
  T extends object,
  E extends object,
  M extends string
>(
  form: FormConstructor<T, M>,
  { defaultExternal, fields }: RecalculateOptions<T, E, M>
): JoinRecalculateResult<E> {
  type Keys = keyof T | keyof E;
  const recalculateMap = fields.reduce(
    (acc, item) => Object.assign(acc, { [item.path]: item }),
    {} as Record<Keys, RecalculateField<T, E, M>>
  );
  const memo = structuredClone(defaultExternal);
  let lastCalledPath: string;
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
    for (const key in result) {
      const res = result[key];

      const { value, mode = "change" } = (
        typeof res === "object" ? res : { value: res }
      ) as { value: unknown; mode?: ChangeMode<M> };

      commits.push({ path: `values.${key}`, value, changeMode: mode });
    }

    form.commit(commits);
  }

  async function callExternal(field: keyof E, value: unknown) {
    if (!(field in recalculateMap)) {
      return;
    }

    const options = recalculateMap[field];
    const prev = Path.get(memo, String(field));
    Path.set(memo, String(field), value);

    try {
      await handleResult(value, prev, options);
    } catch {}
  }

  async function callRecalculate(field: string, detail: Details<T, M>) {
    const options = recalculateMap[field as Keys];
    const { watchType = "native" } = options;
    if (watchType !== (detail.modes.get(`values.${field}`) || "change")) {
      return;
    }

    lastCalledPath = field;

    try {
      await handleResult(
        Path.get(detail.curr, field),
        Path.get(detail.prev, field),
        options
      );
    } catch {}
  }

  const entries: [string, PathTree][] = [];
  for (const path in recalculateMap) {
    if (!Path.has(form.data.values, path)) {
      continue;
    }

    entries.push([path, new PathTree([`values.${path}`])]);
  }

  const unsubscribe = form.listen(({ changeTree, detail }) => {
    const entry = entries.find(([, tree]) => tree.includes(changeTree));
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
          path: `values.${path}`,
          value: value === undefined ? Path.get(form.data.values, path) : value,
          changeMode: options.watchType || "native",
        },
      ]);
    },
    dispose: () => {
      unsubscribe();
    },
  };
}

export { createRecalculate };
