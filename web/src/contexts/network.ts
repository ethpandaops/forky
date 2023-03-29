import { useContext as reactUseContext, createContext } from 'react';

import { State } from '@hooks/useNetwork';

export const Context = createContext<State | undefined>(undefined);

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('Network context must be used within a Network provider');
  }
  return context;
}
