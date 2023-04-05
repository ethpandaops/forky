import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { spec, networkName } from '@app/mocks/handlers';
import ApplicationProvider from '@providers/application';

const queryClient = new QueryClient();

export function ProviderWrapper({ children }: { children: React.ReactNode }) {
  const ethereum = {
    genesisTime: new Date(spec.genesis_time).getTime(),
    secondsPerSlot: spec.seconds_per_slot,
    slotsPerEpoch: spec.slots_per_epoch,
    networkName: networkName,
  };

  const initialTime =
    ethereum.genesisTime + 100 * (ethereum.secondsPerSlot * 1000) - ethereum.secondsPerSlot * 1000;

  return (
    <QueryClientProvider client={queryClient}>
      <ApplicationProvider ethereum={ethereum} focus={{ initialTime }} player={{ playing: true }}>
        {children}
      </ApplicationProvider>
    </QueryClientProvider>
  );
}
