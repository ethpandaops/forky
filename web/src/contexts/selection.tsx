import { useContext as reactUseContext, createContext, useState } from 'react';

export const Context = createContext<State | undefined>(undefined);

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('Selection context must be used within a Selection provider');
  }
  return context;
}

export interface State {
  blockRoot?: string;
  setBlockRoot: (blockRoot?: string) => void;
}

export interface ValueProps {
  blockRoot?: string;
}

export function useValue(props: ValueProps): State {
  const [blockRoot, setBlockRoot] = useState<string | undefined>(props.blockRoot);

  return {
    blockRoot,
    setBlockRoot,
  };
}
