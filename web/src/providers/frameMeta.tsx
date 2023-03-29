import { ReactNode } from 'react';

import { Context } from '@contexts/frameMeta';
import useFrameMeta, { Props as HookProps } from '@hooks/useFrameMeta';

interface Props extends HookProps {
  children: ReactNode;
}

export default function FrameMetaProvider({ children, padding }: Props) {
  const frameMeta = useFrameMeta({ padding });
  return <Context.Provider value={frameMeta}>{children}</Context.Provider>;
}
