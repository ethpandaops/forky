import { useMemo } from 'react';

import Logo from '@assets/forky_logo.png';
import { ValueProps } from '@contexts/ethereum';
import { useSpecQuery, useNowQuery, useNodesQuery } from '@hooks/useQuery';
import Header from '@parts/Header';
import Selection from '@parts/Selection';
import Stage from '@parts/Stage';
import Timeline from '@parts/Timeline';
import ApplicationProvider from '@providers/application';

export default function App({ node }: { node?: string }) {
  const { data, isLoading, error } = useSpecQuery();
  const { data: dataNow, isLoading: isLoadingNow, error: errorNow } = useNowQuery();
  const { data: dataNodes, isLoading: isLoadingMetadata, error: errorMetadata } = useNodesQuery({});

  const firstNode = useMemo(() => {
    if (dataNodes?.length) {
      return dataNodes[0];
    }
  }, [dataNodes]);

  const formattedData = useMemo<ValueProps | undefined>(() => {
    if (!data?.spec) return undefined;
    const { seconds_per_slot, slots_per_epoch, genesis_time } = data.spec;
    if (!seconds_per_slot || !slots_per_epoch || !genesis_time) return undefined;
    return {
      secondsPerSlot: seconds_per_slot,
      slotsPerEpoch: slots_per_epoch,
      // TODO: check parsing
      genesisTime: new Date(genesis_time).getTime(),
      networkName: data.network_name ?? 'Unknown',
    };
  }, [data]);

  const initialTime = useMemo<number | undefined>(() => {
    if (formattedData && dataNow) {
      return (
        formattedData.genesisTime +
        dataNow.slot * (formattedData.secondsPerSlot * 1000) -
        // offset minus 1 slot?
        formattedData.secondsPerSlot * 1000
      );
    }
  }, [formattedData, dataNow]);

  if (isLoading || error || !formattedData || !initialTime || !firstNode)
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-stone-900">
        <img src={Logo} className="object-contain w-72 h-72" />
        <h1 className="mt-6 text-2xl text-white">
          {isLoading ? 'Loading' : `Error: ${error || 'unexpected data returned'}`}
        </h1>
      </div>
    );

  return (
    <ApplicationProvider
      ethereum={formattedData}
      focus={{ initialTime }}
      player={{ playing: true }}
    >
      <div className="relative w-screen h-screen">
        <div className="absolute top-0 left-0 w-full h-full">
          <Header />
          <Selection />
          <main>
            <Stage />
          </main>
          <Timeline />
        </div>
      </div>
    </ApplicationProvider>
  );
}
