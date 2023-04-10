import { useContext as reactUseContext, createContext, ReactNode, useState } from 'react';

import { FrameMetaData } from '@app/types/api';

export const Context = createContext<State | undefined>(undefined);

export type Data = {
  frames?: FrameMetaData[];
  lastFetched: number;
};

export interface State {
  padding: number;
}

export interface HookProps {
  padding: number;
}

function useFrameMeta(props: HookProps): State {
  const [padding, setPadding] = useState<number>(props.padding);

  return {
    padding,
  };
}

interface Props extends HookProps {
  children: ReactNode;
}

export function Provider({ children, padding }: Props) {
  const frameMeta = useFrameMeta({ padding });
  return <Context.Provider value={frameMeta}>{children}</Context.Provider>;
}

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('FrameMeta context must be used within a FrameMeta provider');
  }
  return context;
}
