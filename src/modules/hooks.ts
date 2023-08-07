import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import get from "lodash/get";

import Form, {
  ConstructorParams,
  DefaultValues,
  Errors,
  InputErrors,
  FormState,
  DefaultModes,
} from "./form";

import {
  JoinRecalculateResult,
  RecalculateOptions,
  useCreateRecalculate,
} from "./recalculate";
import { FormContext } from "./provider";

export function useFormContext<T extends object, M extends string>(): Form<
  T,
  M
> {
  return useContext(FormContext) as Form<T, M>;
}

function useContextOrDefault<T extends object, M extends string = never>(
  form?: Form<T, M>
) {
  const formContext = form || useFormContext();
  if (!formContext) {
    throw new Error(
      "An error occurred while retrieving the form context. Check for context or pass it as an argument."
    );
  }

  return formContext;
}

function getOnChangeValue<T>(event: unknown): T {
  if (
    typeof event === "object" &&
    event &&
    "target" in event &&
    event.target &&
    typeof event.target === "object" &&
    "value" in event.target
  ) {
    return event.target.value as T;
  }

  return event as T;
}

interface UseFieldResult<T> {
  change: (value: T) => void;
  fieldState: {
    isTouched: boolean;
    error: string | null;
  };
  input: {
    name: string;
    value: T;
    onChange(event: ChangeEvent<HTMLInputElement>): void;
    onChange(value: T): void;
  };
}

export function useField<
  T = string,
  V extends DefaultValues = DefaultValues,
  M extends string = string
>(name: string, form?: Form<V, M>): UseFieldResult<T> {
  const formContext = useContextOrDefault(form);
  const [value, setValue] = useState<T | null>(() =>
    get(formContext.data.values, name)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeValue = formContext.on([`values.${name}`], () => {
      setValue(get(formContext.data.values, name));
    });
    const unsubscribeError = formContext.on([`errors.${name}`], () => {
      setError(formContext.data.errors[name]);
    });

    return () => {
      unsubscribeValue();
      unsubscribeError();
    };
  }, [formContext, name]);

  return {
    input: {
      name,
      value: (value || "") as T,
      onChange: (event: unknown) => {
        formContext.commit([
          {
            path: name,
            value: getOnChangeValue<T>(event),
            changeMode: "native",
          },
        ]);
      },
    },
    change: (value: T) => formContext.commit([{ path: name, value }]),
    fieldState: {
      isTouched: name in formContext.data.state.touchedFields,
      error,
    },
  };
}

export function useWatch<
  R,
  V extends object = DefaultValues,
  M extends string = DefaultModes
>(path: string, form?: Form<V, M>): R;
export function useWatch<
  R extends Array<unknown>,
  V extends object = DefaultValues,
  M extends string = DefaultModes
>(paths?: string[], form?: Form<V, M>): R;

export function useWatch(
  paths: unknown,
  form?: Form<DefaultValues, DefaultModes>
): unknown {
  const formContext = useContextOrDefault(form);
  const [values, setValues] = useState<unknown>(() =>
    formContext.getValues(paths as string[])
  );

  const watchPath = Array.isArray(paths)
    ? paths.map((path) => `values.${path}`)
    : [`values${paths ? `.${paths}` : ""}`];

  useEffect(
    () =>
      formContext.on(watchPath, () =>
        setValues(formContext.getValues(paths as string[]))
      ),
    watchPath
  );

  return values;
}

export function useForm<T extends object, M extends string = DefaultModes>(
  options: ConstructorParams<T>
): Form<T, M> {
  const formApiRef = useRef<Form<T, M> | null>(null);
  if (!formApiRef.current) {
    formApiRef.current = new Form<T, M>(options);
  }

  return formApiRef.current;
}

export function useRecalculate<
  T extends object,
  E extends object,
  M extends string = DefaultModes
>(
  schema: RecalculateOptions<T, E, M>,
  form?: Form<T, M>
): JoinRecalculateResult<E> {
  const formContext = useContextOrDefault(form);

  return useCreateRecalculate<T, E, M>(formContext, schema);
}

export function useFormState<T extends object, M extends string>(
  form?: Form<T, M>
): FormState {
  const formContext = useContextOrDefault(form);
  const [state, setState] = useState(() => formContext.data.state);

  useEffect(
    () =>
      formContext.on(["state"], () => setState({ ...formContext.data.state })),
    [formContext]
  );

  return state;
}

interface ValidateCallback<T extends DefaultValues, E extends Array<E>> {
  (values: T, errors: Errors, ...external: E): InputErrors | null;
}

const useAction = (
  callback: (...args: unknown[]) => any,
  deps: ReadonlyArray<unknown> = []
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: unknown[]) => callbackRef.current(...args),
    deps
  );
};

export function useValidate<
  T extends DefaultValues,
  D extends Array<any> = Array<any>,
  M extends string = DefaultModes
>(
  validator: ValidateCallback<T, D>,
  deps: D = [] as unknown as D,
  form?: Form<T, M>
): void {
  const formContext = useContextOrDefault(form);

  const validateFn = useAction(() => {
    const result = validator(
      formContext.data.values,
      formContext.data.errors,
      ...deps
    );

    if (result === null) {
      formContext.resetErrors();
    } else if (result) {
      formContext.setErrors(result);
    }
  });

  useEffect(
    () =>
      formContext.on(["values"], validateFn, { priority: Number.MAX_VALUE }),
    [formContext]
  );

  useEffect(() => {
    validateFn();
  }, deps);
}

export function useError<T extends DefaultValues, M extends string>(
  form?: Form<T, M>
): { errors: Errors } & Pick<Form<T, M>, "setErrors" | "resetErrors"> {
  const formContext = useContextOrDefault(form);
  const [errors, setErrors] = useState<Errors>(() => formContext.data.errors);

  useEffect(
    () =>
      formContext.on(["errors"], () => {
        setErrors({ ...formContext.data.errors });
      }),
    [formContext]
  );

  return {
    errors,
    setErrors: formContext.setErrors.bind(formContext),
    resetErrors: formContext.resetErrors.bind(formContext),
  };
}

export function useCommit<T extends DefaultValues, M extends string>(
  form?: Form<T, M>
) {
  const formContext = useContextOrDefault(form);

  return formContext.commit.bind(formContext);
}
