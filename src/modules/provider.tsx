import { PropsWithChildren, ReactElement } from "react";
import { FormConstructor, FormContext } from "../shared";

interface Props<T extends object, M extends string> extends PropsWithChildren {
  form: FormConstructor<T, M>;
}

function FormProvider<T extends object, M extends string>({
  form,
  children,
}: Props<T, M>): ReactElement<Props<T, M>> {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

export default FormProvider;
