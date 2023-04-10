import { useForm, useField, FormProvider, useRecalculate } from "../../dist/dev";

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
  const form = useForm({
    defaultValues: { first: 0, second: 0 },
  });

  useRecalculate(
    {
      fields: [
        {
          path: "first",
          handler(current) {
            return {
              second: Number(current) + 10,
            };
          },
        },
        {
          path: "second",
          handler(current) {
            return {
              first: Number(current) * 10,
            };
          },
        },
      ],
    },
    form
  );

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit((values) => console.log(values))}>
        <h1>Recalculate</h1>
        <div>
          <Input name="first" type="number" label="First" />
        </div>
        <div>
          <Input name="second" type="number" label="Second" />
        </div>

        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

export default App;
