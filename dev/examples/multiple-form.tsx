import React, { useEffect, useState } from "react";
import {
  useForm,
  useField,
  FormProvider,
  useRecalculate,
  useValidate,
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

  console.log("field: ", input, error);

  return (
    <label>
      <span>{label} </span>
      <input {...input} type={type} />
      {error && <div style={{ color: "tomato" }}>{error}</div>}
    </label>
  );
}

function SecondForm({ mul }) {
  const recalculate = useRecalculate({
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
          const field = lastCalledPath === "second" ? "first" : "second";
          const valueField = field === "first" ? "second" : "first";

          return {
            [field]: Number(values[valueField]) * Number(current),
          };
        },
      },
    ],
  });

  useEffect(() => {
    recalculate.callExternal("multiple", mul);
  }, [mul]);

  return (
    <>
      <div>
        <Input name="first" type="number" label="First" />
      </div>
      <div>
        <Input name="second" type="number" label="Second" />
      </div>
    </>
  );
}

function FirstForm({ mul }) {
  return (
    <>
      <div>
        <Input name="first" type="number" label="First" />
      </div>
    </>
  );
}

function Form({ isFirstForm, mul }) {
  useValidate((values) => {
    console.log(values);

    return {};
  });

  const FormComponent = isFirstForm ? FirstForm : SecondForm;

  return <FormComponent mul={mul} />;
}

function App() {
  const [isFirstForm, setIsFirstForm] = useState(false);
  const [mul, setMul] = useState(1);
  const form = useForm({
    defaultValues: { first: 0, second: 0 },
  });

  return (
    <FormProvider form={form}>
      <h1>Multiple form</h1>

      <div>
        <button
          onClick={() => {
            setIsFirstForm(true);
          }}
          disabled={isFirstForm}
        >
          pair
        </button>
        <button
          onClick={() => {
            setIsFirstForm(false);
          }}
          disabled={!isFirstForm}
        >
          single
        </button>
      </div>
      <form onSubmit={form.handleSubmit((values) => console.log(values))}>
        <Form isFirstForm={isFirstForm} mul={mul} />

        <button type="submit">Submit</button>
      </form>

      <button
        onClick={() => {
          setMul((p) => p + 1);
        }}
      >
        mul: {mul}
      </button>
    </FormProvider>
  );
}

export default App;
