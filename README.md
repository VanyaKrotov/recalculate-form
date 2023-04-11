# recalculate-form

[![ Версия npm ](https://badge.fury.io/js/recalculate-form.svg)](https://badge.fury.io/js/recalculate-form)

## Установка

```
npm i recalculate-form
```

Or

```
yarn add recalculate-form
```

## API

### `Form<T, M>` - основной класс для создания экземпляра формы

Типизация:

- `T` - значения формы;
- `M` - типы мутаций (расширяет базовые: `native` | `change`)

Данные:

- `data` - объект с реактивными данными формы;

Методы:

- `getValues(): T` - метод для получения значений формы;

- `getValues<T>(...paths: string[]): T` - метод для получения конкретных значений формы;

- `setErrors(errors: Errors): void` - метод для установки ошибок формы;

- `resetError(...paths: string[]): void` - метод для сброса ошибок формы(при вызове без параметров сносит все ошибки);

- `reset(): void` - метод полной очистки формы;

- `commit(changes: Commit<ChangeMode<M>): boolean[]` - метод для внесения изменений в поля формы;

- `handleSubmit(onSubmit: OnSubmit<T>): (event?: FormEvent) => void` - метод для подключения html формы;

### `useForm<T, M>(options: FormConstructorParams<T>)` - хук для создания локального экземпляра формы;

Типизация:

- `T` - значения формы;
- `M` - типы мутаций (расширяет базовые: `native` | `change`)

### `useField<T, V, M>(name: string, form?: FormConstructor<V, M>): UseFieldResult<T>` - хук для подключения html полей к форме;

Типизация:

- `T` - значение поля;
- `V` - значения формы;
- `M` - типы мутаций (расширяет базовые: `native` | `change`)

Возвращаемое значение:

- `input: object` - значения для нативного html инпута (`value`, `onChange` с типом мутации `native`, `name`);

- `fieldState: object` - значение дополнительных состояний формы (`isTouched`, `error`);

- `change(value: T)` - функция для мутирования значения поля (тип мутации `change`);

### `useWatch<V, R, M>(paths?: string[], form?: FormConstructor<V, M>): UseFieldResult<T>` - хук подписки на отслеживание изменения полей переданных в параметре `paths`;

Типизация:

- `V` - значения формы;
- `R` - возвращаемое значение;
- `M` - типы мутаций (расширяет базовые: `native` | `change`)

### `useFormState<T, M>(form?: FormConstructor<V, M>): UseFieldResult<T>` - хук подписки на отслеживание изменения состояний формы;

Типизация:

- `T` - значения формы;
- `M` - типы мутаций (расширяет базовые: `native` | `change`);

Возвращаемое значение:

- `touchedFields: Set<string>` - пути к измененным значеним полей ввода;

- `isSubmitted: boolean` - указывает на то был ли совершен вызов метода `onSubmit`;

- `isSubmitting: boolean` - состояние выполнения метода `onSubmit`;

### `useErrors<T, M>(form?: FormConstructor<V, M>): Errors` - хук подписки на отслеживание изменения ошибок формы;

Типизация:

- `T` - значения формы;
- `M` - типы мутаций (расширяет базовые: `native` | `change`);

Возвращаемое значение:

- `errors: Record<string, string | null>` - объект с ошибками формы;

### `useValidate<T, M>(validator: ValidateCallback<T>, form?: FormConstructor<V, M>): Errors` - хук для валидации формы. Вызов метода `validator` производится в момент изменения значений формы;

Типизация:

- `T` - значения формы;
- `M` - типы мутаций (расширяет базовые: `native` | `change`);

- `validator: ValidateCallback<T>` - метод для валидации. Принимает аргементами значения формы и ошибки, возвращает объект ошибок или пустой объект;

### `useRecalculate<T, E, M>(schema: RecalculateOptions<T, E, M>, form?: FormConstructor<V, M>): JoinRecalculateResult<E>` - хук для подключения декораторов перерасчета значений;

Типизация:

- `T` - значения формы;
- `E` - значения внешних значений влияющих на расчеты;
- `M` - типы мутаций (расширяет базовые: `native` | `change`);

Возвращаемое значение:

- `callExternal(field: keyof E, value: unknown): void` - функция для вызова мутации внешних зависимостей;

- `callRecalculate(field: string, value?: unknown): void` - функция для вызова перерасчетов формы (иммитирует изменение значения из поля ввода). Вызывает декораторы с типом мутации указанным для отслеживания;

- `dispose: VoidFunction` - метод для очищеня дначений и отключения отслеживания значений;

### `useCommit<T, M>(form?: FormConstructor<T, M>): CommitFunction` - хук для получения функции мутации значений формы.

### `FormProvider<T, M>` - `react` компонент провайдера формы;

## Примеры

### Бызовая форма логина

```ts
import { useForm, useField } from "recalculate-form";

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
      <span>{label}</span>
      <input {...input} type={type} />
      {error && <div style={{ color: "tomato" }}>{error}</div>}
    </label>
  );
}

function App() {
  const form = useForm({
    defaultValues: { password: "", username: "" },
  });

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
    </FormProvider>
  );
}
```

### Бызовая форма с перерасчетом значений

```ts
import { useForm, useField, useRecalculate } from "recalculate-form";

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
```

### Форма с перерасчетом значений и внешней зависимостью

```ts
import { useEffect, useState } from "react";
import {
  useForm,
  useField,
  FormProvider,
  useRecalculate,
} from "recalculate-form";

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
```
