import { useContext as reactUseContext, createContext } from 'react';

import { State } from '@hooks/useFrameMeta';

export const Context = createContext<State | undefined>(undefined);

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('FrameMeta context must be used within a FrameMeta provider');
  }
  return context;
}
