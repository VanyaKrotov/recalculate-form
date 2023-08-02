import React, { useEffect, useState } from "react";
import {
  useForm,
  useField,
  FormProvider,
  useRecalculate,
  useValidate,
  useFormContext,
} from "../../src";

interface InputProps {
  name: string;
  type: "text" | "number";
  label: string;
}

function Input({ name, type, label }: InputProps) {
  const {
    input,
    fieldState: { error },
  } = useField<string>(name);

  console.log("field: ", name, input);

  return (
    <label>
      <span>{label} </span>
      <input {...input} type={type} />
      {error && <div style={{ color: "tomato" }}>{error}</div>}
    </label>
  );
}

function Component() {
  const [mul, setMul] = useState(10);

  return (
    <>
      <Form mul={mul} />
      <button onClick={() => setMul((prev) => prev + 1)}>{mul}</button>
    </>
  );
}

function App() {
  const form = useForm({
    defaultValues: { first: 2, second: 0 },
  });

  useValidate(
    (values) => {
      console.log("validate: ", values.first, values.second);

      return null;
    },
    [],
    form
  );

  return (
    <FormProvider form={form}>
      <Component />
    </FormProvider>
  );
}

const recMap = [
  {
    path: "first",
    handler(current, prev, { external }) {
      return {
        second: Number(current) * external.multiple,
      };
    },
  },
  {
    path: "second",
    handler(current, prev, { external }) {
      return {
        first: Number(current) * external.multiple,
      };
    },
  },
  {
    path: "multiple",
    handler(current, prev, { lastCalledPath = "first", values }) {
      const field = lastCalledPath === "first" ? "second" : "first";
      console.log(current, prev, lastCalledPath, values);
      console.log(values[lastCalledPath as keyof typeof values]);

      return {
        [field]:
          values[lastCalledPath as keyof typeof values] * Number(current),
      };
    },
  },
];

function Form({ mul }) {
  const form = useFormContext();

  const recalculate = useRecalculate(
    { defaultExternal: { multiple: mul }, fields: recMap },
    form
  );

  useEffect(() => {
    recalculate.callExternal("multiple", mul);
  }, [mul]);

  return (
    <form onSubmit={form.handleSubmit((values) => console.log(values))}>
      <h1>Recalculate external</h1>
      <div>
        <Input name="first" type="number" label="First" />
      </div>
      <div>
        <Input name="second" type="number" label="Second" />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

export default App;
