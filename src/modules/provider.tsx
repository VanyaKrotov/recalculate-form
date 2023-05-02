import { PropsWithChildren, ReactElement, createContext } from "react";

import Form, { DefaultValues } from "./form";

export const FormContext = createContext({} as Form<DefaultValues, string>);

interface Props<T extends object, M extends string> extends PropsWithChildren {
  form: Form<T, M>;
}

function FormProvider<T extends object, M extends string>({
  form,
  children,
}: Props<T, M>): ReactElement<Props<T, M>> {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

export default FormProvider;
