import { useContext as reactUseContext, createContext } from 'react';

import { State } from '@hooks/useTimeline';

export const Context = createContext<State | undefined>(undefined);

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('Timeline context must be used within a Timeline provider');
  }
  return context;
}
