import { ReactNode } from 'react';

import { Context, useValue } from '@contexts/selection';

export interface Props {
  children: ReactNode;
}

export default function Provider({ children }: Props) {
  const value = useValue();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
