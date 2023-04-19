import { useMemo } from 'react';

import Loading from '@components/Loading';
import { ValueProps } from '@contexts/ethereum';
import { useSpecQuery, useNowQuery } from '@hooks/useQuery';
import Events from '@parts/Events';
import FrameFooter from '@parts/FrameFooter';
import Header from '@parts/Header';
import Selection from '@parts/Selection';
import Stage from '@parts/Stage';
import Timeline from '@parts/Timeline';
import ApplicationProvider from '@providers/application';

export default function App({ node, frameId }: { node?: string; frameId?: string }) {
  const { data, isLoading, error } = useSpecQuery();
  const { data: dataNow, isLoading: isLoadingNow, error: errorNow } = useNowQuery();

  const formattedData = useMemo<ValueProps | undefined>(() => {
    if (!data?.spec) return undefined;
    const { seconds_per_slot, slots_per_epoch, genesis_time } = data.spec;
    if (!seconds_per_slot || !slots_per_epoch || !genesis_time) return undefined;
    return {
      secondsPerSlot: seconds_per_slot,
      slotsPerEpoch: slots_per_epoch,
      genesisTime: new Date(genesis_time).getTime(),
      networkName: data.network_name ?? 'Unknown',
    };
  }, [data]);

  const [initialTime, playing] = useMemo<[number | undefined, boolean]>(() => {
    // use the time from the url if it exists
    const time = new URLSearchParams(window.location.search).get('t');
    if (time) {
      const parsed = parseInt(time);
      if (!isNaN(parsed)) {
        return [parsed, false];
      }
    }

    // use the server time if it exists
    if (formattedData && dataNow) {
      return [
        formattedData.genesisTime +
          dataNow.slot * (formattedData.secondsPerSlot * 1000) -
          // offset minus 1 slot?
          formattedData.secondsPerSlot * 1000,
        true,
      ];
    }

    // worst case when failing to get server now, just use the current local time
    return [errorNow ? Date.now() : undefined, true];
  }, [formattedData, dataNow, errorNow]);

  if (isLoading || error || !formattedData || !initialTime || isLoadingNow)
    return (
      <div className="w-screen h-screen bg-stone-900">
        <Loading
          message={
            isLoading || isLoadingNow
              ? 'Loading...'
              : `${error || 'Error: unexpected data returned'}`
          }
        />
      </div>
    );

  return (
    <ApplicationProvider ethereum={formattedData} focus={{ initialTime, node, frameId, playing }}>
      <div className="relative w-screen h-screen">
        <div className="absolute top-0 left-0 w-full h-full">
          <Header />
          <Selection />
          <Events />
          <main>
            <Stage />
          </main>
          {frameId ? <FrameFooter /> : <Timeline />}
        </div>
      </div>
    </ApplicationProvider>
  );
}
