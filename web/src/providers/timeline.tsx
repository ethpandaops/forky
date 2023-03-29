import { ReactNode } from 'react';

import { Context } from '@contexts/timeline';
import useTimeline, { Props as HookProps } from '@hooks/useTimeline';

interface Props extends HookProps {
  children: ReactNode;
}

export default function TimelineProvider({ children, ...props }: Props) {
  const timeline = useTimeline(props);
  return <Context.Provider value={timeline}>{children}</Context.Provider>;
}
