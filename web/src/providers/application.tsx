import { ReactNode } from 'react';

import EthereumProvider, { Props as EthereumProps } from '@providers/ethereum';
import FocusProvider, { Props as FocusProps } from '@providers/focus';
import PlayerProvider, { Props as PlayerProps } from '@providers/player';
import SelectionProvider, { Props as SelectionProps } from '@providers/selection';

interface Props {
  children: ReactNode;
  ethereum: Omit<EthereumProps, 'children'>;
  focus: Omit<FocusProps, 'children'>;
  player: Omit<PlayerProps, 'children'>;
  selection?: Omit<SelectionProps, 'children'>;
}

function Provider({ children, ethereum, focus, player, selection }: Props) {
  return (
    <EthereumProvider {...ethereum}>
      <FocusProvider {...focus}>
        <PlayerProvider {...player}>
          <SelectionProvider {...selection}>{children}</SelectionProvider>
        </PlayerProvider>
      </FocusProvider>
    </EthereumProvider>
  );
}

export default Provider;
