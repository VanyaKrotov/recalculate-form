import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  useField,
  useFormContext,
  useWatch,
  useForm,
  FormProvider,
  useRecalculate,
  useFormState,
} from "../src";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);

interface InputProps {
  name: string;
}

function Input({ name }: InputProps) {
  const { input } = useField<string>(name);

  console.log(`render[input:${name}]`);

  return <input {...input} type="number" />;
}

function Bottom() {
  const values = useWatch();
  console.log("render[Bottom]");

  return <pre>{JSON.stringify(values)}</pre>;
}

function App() {
  type Values = { first: number; second: number };
  const [values, setValues] = useState(["a", "b"]);
  const form = useForm<Values, "base">({
    defaultValues: { first: 1, second: 0 },
  });

  const recalculate = useRecalculate(
    {
      fields: [
        {
          path: "first",
          handler: (current, _prev, { external: { price = 1 } }) => {
            return {
              second: Number(current) * price,
            };
          },
        },
        {
          path: "second",
          handler: (current, _prev, { external: { price = 1 } }) => {
            return {
              first: Number(current) * price,
            };
          },
        },
        {
          path: "price",
          handler: (current, prev, { values, lastCalledPath = "first" }) => {
            return {
              [lastCalledPath === "first" ? "second" : "first"]:
                Number(current) * values[lastCalledPath as keyof typeof values],
            };
          },
        },
      ],
      defaultExternal: { price: 1 },
    },
    form
  );

  console.log(recalculate);

  useEffect(() => {
    let price = 1;
    setInterval(() => {
      recalculate.callExternal("price", ++price);
    }, 5000);
  }, []);

  console.log("render[App]");

  return (
    <FormProvider form={form}>
      <form
        onSubmit={form.handleSubmit(
          async (values) =>
            new Promise((res) =>
              setTimeout(() => {
                res();
                console.log(values);
              }, 5000)
            )
        )}
      >
        <div>
          <Input name="first" />
          <select
            value={values[0]}
            onChange={({ target: { value } }) => {
              setValues((prev) => {
                return prev[1] === value ? [value, prev[0]] : [value, prev[1]];
              });

              recalculate.callRecalculate("first");
            }}
          >
            <option value="a">A</option>
            <option value="b">B</option>
          </select>
        </div>

        <div>
          <Input name="second" />

          <select
            value={values[1]}
            onChange={({ target: { value } }) => {
              setValues((prev) =>
                prev[0] === value ? [prev[1], value] : [prev[0], value]
              );
              recalculate.callRecalculate("second");
            }}
          >
            <option value="a">A</option>
            <option value="b">B</option>
          </select>
        </div>

        <button type="submit">submit</button>
      </form>

      <Button />
      <Bottom />
    </FormProvider>
  );
}

function Button() {
  const form = useFormContext();
  const { isSubmitting } = useFormState();

  return (
    <button disabled={isSubmitting} onClick={() => form.reset()}>
      reset
    </button>
  );
}
