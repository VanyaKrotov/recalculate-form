import { useContext, useEffect, useRef, useState } from "react";
import { Path } from "projectx.state";

import Form from "./form";
import {
  FormConstructor,
  FormConstructorParams,
  FormContext,
  FormDefaultValues,
  FormState,
  JoinRecalculateResult,
  RecalculateOptions,
  UseFieldResult,
} from "../shared";
import { createRecalculate } from "./recalculate";

export function useFormContext<
  T extends object,
  M extends string
>(): FormConstructor<T, M> {
  return useContext(FormContext) as FormConstructor<T, M>;
}

export function useField<
  T,
  V extends FormDefaultValues = FormDefaultValues,
  M extends string = string
>(name: string, form?: FormConstructor<V, M>): UseFieldResult<T> {
  const formContext = form || useFormContext();
  const path = `values.${name}`;
  const [value, setValue] = useState<T>(() => Path.get(formContext.data, path));

  useEffect(
    () =>
      formContext.watch([path], () =>
        setValue(Path.get(formContext.data, path))
      ),
    [formContext, path]
  );

  return {
    input: {
      name,
      value,
      onChange: ({ target: { value } }) =>
        formContext.commit([{ path, value, changeMode: "native" }]),
    },
    change: <T>(value: T) => formContext.commit([{ path, value }]),
    fieldState: {
      isDirty: formContext.formState.dirtyFields.has(name),
      isTouched: formContext.formState.touchedFields.has(name),
    },
    error: formContext.data.errors[path] || null,
  };
}

export function useWatch<
  V extends object,
  R extends FormDefaultValues,
  M extends string
>(paths: string[] = [], form?: FormConstructor<V, M>): R {
  const formContext = form || useFormContext();
  const [values, setValues] = useState<R>(() => formContext.getValues(paths));

  useEffect(
    () =>
      formContext.watch(
        paths.length ? paths.map((path) => `values.${path}`) : ["values"],
        () => {
          setValues({ ...(formContext.getValues(paths) as R) });
        }
      ),
    paths
  );

  return values;
}

export function useForm<T extends object, M extends string = "">(
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
  const formContext = form || useFormContext<T, M>();
  const resultRef = useRef<JoinRecalculateResult<E> | null>(null);
  if (!resultRef.current) {
    resultRef.current = createRecalculate<T, E, M>(formContext, schema);
  }

  useEffect(() => {
    return () => {
      resultRef.current.dispose();
    };
  }, []);

  return resultRef.current;
}

export function useFormState<T extends object, M extends string>(
  form?: FormConstructor<T, M>
): FormState {
  const formContext = form || useFormContext();
  const [state, setState] = useState(() => formContext.formState);

  useEffect(
    () =>
      formContext.watch(["state"], () =>
        setState({ ...formContext.formState })
      ),
    [formContext]
  );

  return state;
}
