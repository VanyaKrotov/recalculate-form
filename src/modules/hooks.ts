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

export function useField<
  T,
  V extends FormDefaultValues = FormDefaultValues,
  M extends string = string
>(name: string, form?: FormConstructor<V, M>): UseFieldResult<T> {
  const formContext = form || useFormContext();
  const [value, setValue] = useState<T>(() =>
    Path.get(formContext.data.values, name)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeValue = formContext.watch([`values.${name}`], () =>
      setValue(Path.get(formContext.data.values, name))
    );
    const unsubscribeError = formContext.watch(["errors"], () => {
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
      value,
      onChange: ({ target: { value } }) =>
        formContext.commit([{ path: name, value, changeMode: "native" }]),
    },
    change: (value: T) => formContext.commit([{ path: name, value }]),
    fieldState: {
      isTouched: formContext.data.state.touchedFields.has(name),
      error,
    },
  };
}

export function useWatch<
  V extends object,
  R extends FormDefaultValues,
  M extends string
>(paths: string[] = [], form?: FormConstructor<V, M>): R {
  const formContext = form || useFormContext();
  const [values, setValues] = useState<R>(() =>
    formContext.getValues(...paths)
  );

  useEffect(
    () =>
      formContext.watch(
        paths.length ? paths.map((path) => `values.${path}`) : ["values"],
        () => {
          setValues(formContext.getValues(...paths));
        }
      ),
    paths
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
  form: FormConstructor<T, M>
): void {
  const formContext = form || useFormContext();

  useEffect(
    () =>
      formContext.watch(["values"], () => {
        const result = validator(
          formContext.data.values,
          formContext.data.errors
        );

        if (result instanceof Promise) {
          result.then((errors) => formContext.setErrors(errors));
        } else {
          formContext.setErrors(result);
        }
      }),
    [formContext]
  );
}

export function useErrors<T extends FormDefaultValues, M extends string>(
  form?: FormConstructor<T, M>
): Errors {
  const formContext = form || useFormContext();
  const [errors, setErrors] = useState<Errors>(() => formContext.data.errors);

  useEffect(
    () =>
      formContext.watch(["errors"], () => {
        setErrors(formContext.data.errors);
      }),
    [formContext]
  );

  return errors;
}
