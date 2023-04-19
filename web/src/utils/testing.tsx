import { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { spec, networkName } from '@app/mocks/handlers';
import ApplicationProvider from '@providers/application';
import { Props as EthereumProps } from '@providers/ethereum';
import { Props as FocusProps } from '@providers/focus';
import { Props as SelectionProps } from '@providers/selection';

const queryClient = new QueryClient();

interface Props {
  ethereum?: Omit<EthereumProps, 'children'>;
  focus?: Omit<FocusProps, 'children'>;
  selection?: Omit<SelectionProps, 'children'>;
}

export function ProviderWrapper({ ethereum, focus, selection }: Props | undefined = {}) {
  const ethereumProps = ethereum || {
    genesisTime: new Date(spec.genesis_time).getTime(),
    secondsPerSlot: spec.seconds_per_slot,
    slotsPerEpoch: spec.slots_per_epoch,
    networkName: networkName,
  };

  const focusProps = focus || {
    playing: true,
    initialTime:
      ethereumProps.genesisTime +
      100 * (ethereumProps.secondsPerSlot * 1000) -
      ethereumProps.secondsPerSlot * 1000,
  };

  return function Provider({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ApplicationProvider ethereum={ethereumProps} focus={focusProps} selection={selection}>
          {children}
        </ApplicationProvider>
      </QueryClientProvider>
    );
  };
}
