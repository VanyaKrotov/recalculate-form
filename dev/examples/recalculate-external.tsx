import React, { useEffect, useState } from "react";
import { useForm, useField, FormProvider, useRecalculate } from "../../src";

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

  return (
    <label>
      <span>{label} </span>
      <input {...input} type={type} />
      {error && <div style={{ color: "tomato" }}>{error}</div>}
    </label>
  );
}

function App() {
  const [mul, setMul] = useState(10);
  const form = useForm({
    defaultValues: { first: 0, second: 0 },
  });

  const recalculate = useRecalculate(
    {
      defaultExternal: { multiple: mul },
      fields: [
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
          handler(current, prev, { lastCalledPath, values }) {
            const field = lastCalledPath === "first" ? "second" : "first";

            return {
              [field]:
                values[lastCalledPath as keyof typeof values] * Number(current),
            };
          },
        },
      ],
    },
    form
  );

  useEffect(() => {
    recalculate.callExternal("multiple", mul);
  }, [mul]);

  return (
    <FormProvider form={form}>
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

      <button onClick={() => setMul((prev) => prev + 1)}>{mul}</button>
    </FormProvider>
  );
}

export default App;
