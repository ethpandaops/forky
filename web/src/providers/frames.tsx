import { ReactNode } from 'react';

import { Context } from '@contexts/frames';
import useFrames from '@hooks/useFrames';

interface Props {
  children: ReactNode;
}

export default function FramesProvider({ children }: Props) {
  const frames = useFrames();
  return <Context.Provider value={frames}>{children}</Context.Provider>;
}
