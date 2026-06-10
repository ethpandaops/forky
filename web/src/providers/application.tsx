import { ReactNode } from 'react';

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
  return (
    <EthereumProvider {...ethereum}>
      <FocusProvider {...focus}>
        <SelectionProvider {...selection}>{children}</SelectionProvider>
      </FocusProvider>
    </EthereumProvider>
  );
}

export default Provider;
