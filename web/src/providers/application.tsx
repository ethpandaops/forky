import { ReactNode } from 'react';

import { navigate } from 'wouter/use-browser-location';

import EthereumProvider, { Props as EthereumProps } from '@providers/ethereum';
import FocusProvider, { Props as FocusProps } from '@providers/focus';
import SelectionProvider, { Props as SelectionProps } from '@providers/selection';

interface Props {
  children: ReactNode;
  ethereum: Omit<EthereumProps, 'children'>;
  focus: Omit<FocusProps, 'children'>;
  selection?: Omit<SelectionProps, 'children'>;
}

function Provider({ children, ethereum, focus, selection }: Props) {
  // clear the time param if it exists
  if (new URLSearchParams(window.location.search).get('t')) {
    navigate(window.location.pathname, { replace: true });
  }
  return (
    <EthereumProvider {...ethereum}>
      <FocusProvider {...focus}>
        <SelectionProvider {...selection}>{children}</SelectionProvider>
      </FocusProvider>
    </EthereumProvider>
  );
}

export default Provider;
