import { useForm, useField, FormProvider, useCommit } from "../../src";

interface InputProps {
  name: string;
  type: "text" | "password";
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
    defaultValues: { password: "", username: "" },
  });

  const commit = useCommit(form);

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit((values) => console.log(values))}>
        <h1>Login</h1>
        <div>
          <Input name="username" type="text" label="Username" />
        </div>
        <div>
          <Input name="password" type="password" label="password" />
        </div>

        <button type="submit">Login</button>
      </form>

      <button onClick={() => commit([{ path: "username", value: "test" }])}>
        push
      </button>
    </FormProvider>
  );
}

export default App;
