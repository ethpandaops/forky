import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Response, V1GetEthereumSpecResponse } from '@app/types/api';
import Logo from '@assets/forky_logo.png';
import Manager from '@components/Manager';
import { Props } from '@hooks/useNetwork';

export default function Index() {
  const { data, isLoading, error } = useQuery<Response<V1GetEthereumSpecResponse>, Error>(
    ['ethereum', 'spec'],
    async () => {
      const res = await fetch('/api/v1/ethereum/spec');
      return res.json();
    },
  );

  const formattedData = useMemo<Props | undefined>(() => {
    if (!data?.data?.spec) return undefined;
    const { seconds_per_slot, slots_per_epoch, genesis_time } = data.data.spec;
    if (!seconds_per_slot || !slots_per_epoch || !genesis_time) return undefined;
    return {
      secondsPerSlot: seconds_per_slot,
      slotsPerEpoch: slots_per_epoch,
      // TODO: check parsing
      genesisTime: new Date(genesis_time).getTime(),
      networkName: data.data.network_name ?? 'Unknown',
    };
  }, [data]);

  if (isLoading || error || !formattedData)
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-stone-900">
        <img src={Logo} className="object-contain w-72 h-72" />
        <h1 className="mt-6 text-2xl text-white">
          {isLoading ? 'Loading' : `Error: ${error || 'unexpected data returned'}`}
        </h1>
      </div>
    );

  return <Manager {...formattedData} />;
}
