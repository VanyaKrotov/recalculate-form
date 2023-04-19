import { useContext, useEffect, useRef, useState } from "react";
import { Path } from "projectx.state";

import Form from "./form";
import {
  Errors,
  FormConstructor,
  FormConstructorParams,
  FormContext,
  FormDefaultValues,
  FormState,
  InputErrors,
  JoinRecalculateResult,
  RecalculateOptions,
  UseFieldResult,
  ValidateCallback,
} from "../shared";
import { createRecalculate } from "./recalculate";

export function useFormContext<
  T extends object,
  M extends string
>(): FormConstructor<T, M> {
  return useContext(FormContext) as FormConstructor<T, M>;
}

function useContextOrDefault<T extends object, M extends string = never>(
  form?: FormConstructor<T, M>
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

export function useField<
  T = string,
  V extends FormDefaultValues = FormDefaultValues,
  M extends string = string
>(name: string, form?: FormConstructor<V, M>): UseFieldResult<T> {
  const formContext = useContextOrDefault(form);
  const [value, setValue] = useState<T | null>(() =>
    Path.get(formContext.data.values, name)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeValue = formContext.watch([`values.${name}`], () => {
      setValue(Path.get(formContext.data.values, name));
    });
    const unsubscribeError = formContext.watch([`errors.${name}`], () => {
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
      isTouched: formContext.data.state.touchedFields.has(name),
      error,
    },
  };
}

export function useWatch<V extends object, R, M extends string>(
  path: string,
  form?: FormConstructor<V, M>
): R;
export function useWatch<
  V extends object,
  R extends FormDefaultValues,
  M extends string
>(paths?: string[], form?: FormConstructor<V, M>): R;

export function useWatch(
  paths: unknown,
  form?: FormConstructor<FormDefaultValues, string>
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
      formContext.watch(watchPath, () =>
        setValues(formContext.getValues(paths as string[]))
      ),
    watchPath
  );

  return values;
}

export function useForm<T extends object, M extends string = string>(
  options: FormConstructorParams<T>
): FormConstructor<T, M> {
  const formApiRef = useRef<FormConstructor<T, M> | null>(null);
  if (!formApiRef.current) {
    formApiRef.current = new Form<T, M>(options);
  }

  return formApiRef.current;
}

export function useRecalculate<
  T extends object,
  E extends object,
  M extends string = never
>(
  schema: RecalculateOptions<T, E, M>,
  form?: FormConstructor<T, M>
): JoinRecalculateResult<E> {
  const formContext = useContextOrDefault(form);
  const resultRef = useRef<JoinRecalculateResult<E> | null>(null);
  if (!resultRef.current) {
    resultRef.current = createRecalculate<T, E, M>(formContext, schema);
  }

  useEffect(
    () => () => {
      resultRef.current?.dispose();
    },
    []
  );

  return resultRef.current;
}

export function useFormState<T extends object, M extends string>(
  form?: FormConstructor<T, M>
): FormState {
  const formContext = useContextOrDefault(form);
  const [state, setState] = useState(() => formContext.data.state);

  useEffect(
    () =>
      formContext.watch(["state"], () =>
        setState({ ...formContext.data.state })
      ),
    [formContext]
  );

  return state;
}

export function useValidate<T extends FormDefaultValues, M extends string>(
  validator: ValidateCallback<T>,
  form?: FormConstructor<T, M>
): void {
  const formContext = useContextOrDefault(form);

  useEffect(
    () =>
      formContext.watch(["values"], () => {
        const result = validator(
          formContext.data.values,
          formContext.data.errors
        );

        if (result === null) {
          formContext.resetErrors();
        } else {
          formContext.setErrors(result);
        }
      }),
    [formContext, validator]
  );
}

export function useError<T extends FormDefaultValues, M extends string>(
  form?: FormConstructor<T, M>
): { errors: Errors } & Pick<
  FormConstructor<T, M>,
  "setErrors" | "resetErrors"
> {
  const formContext = useContextOrDefault(form);
  const [errors, setErrors] = useState<Errors>(() => formContext.data.errors);

  useEffect(
    () =>
      formContext.watch(["errors"], () => {
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

export function useCommit<T extends FormDefaultValues, M extends string>(
  form?: FormConstructor<T, M>
) {
  const formContext = useContextOrDefault(form);

  return formContext.commit.bind(formContext);
}
