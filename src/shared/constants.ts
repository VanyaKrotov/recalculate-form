import { createContext } from "react";

import { FormConstructor, FormDefaultValues } from "./types";

export const FormContext = createContext(
  {} as FormConstructor<FormDefaultValues, string>
);
