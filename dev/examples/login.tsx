import React from "react";
import {
  useForm,
  useField,
  FormProvider,
  useCommit,
  useValidate,
  useError,
} from "../../src";

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

  const { errors, resetErrors, setErrors } = useError(form);

  useValidate(
    ({ password, username }) => {
      const errors: any = {};

      errors.password = password.length ? null : "Error";
      errors.username = username.length ? null : "Error";

      return errors;
    },
    [],
    form
  );

  console.log(errors);

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

      <button onClick={() => setErrors({ loading: "random text" })}>
        set errors
      </button>
      <button onClick={() => setErrors({ loading: null })}>
        reset random errors
      </button>
      <button onClick={() => resetErrors()}>reset errors</button>
    </FormProvider>
  );
}

export default App;
