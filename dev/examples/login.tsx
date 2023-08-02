import React, { useState } from "react";
import {
  useForm,
  useField,
  FormProvider,
  useValidate,
  useError,
  useWatch,
} from "../../src";

interface InputProps {
  name: string;
  type: "text" | "password";
  label: string;
}

function Input({ name, type, label }: InputProps) {
  const {
    input,
    fieldState: { error, isTouched },
  } = useField<string>(name);

  return (
    <label>
      <span>{label} </span>
      <input {...input} type={type} />
      {error && isTouched && <div style={{ color: "tomato" }}>{error}</div>}
    </label>
  );
}

function Comp() {
  const res = useWatch(["password", "username"]);

  return <pre>{JSON.stringify(res)}</pre>;
}

function App() {
  const [c, set] = useState(false);
  const form = useForm({
    defaultValues: { password: "", username: "" },
  });

  const { errors, resetErrors, setErrors } = useError(form);

  useValidate(
    ({ password, username }, err, showErrors) => {
      if (!showErrors) {
        return null;
      }

      const errors: any = {};

      errors.password = password.length ? null : "Error";
      errors.username = username.length ? null : "Error";

      return errors;
    },
    [c],
    form
  );

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

      <button onClick={() => set(true)} disabled={c}>
        on
      </button>
      <button onClick={() => set(false)} disabled={!c}>
        off
      </button>
      <Comp />
    </FormProvider>
  );
}

export default App;
