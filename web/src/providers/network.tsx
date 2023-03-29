import { ReactNode } from 'react';

import { Context } from '@contexts/network';
import useNetwork, { Props as HookProps } from '@hooks/useNetwork';

interface Props extends HookProps {
  children: ReactNode;
}

export default function NetworkProvider({ children, ...state }: Props) {
  const network = useNetwork(state);
  return <Context.Provider value={network}>{children}</Context.Provider>;
}
