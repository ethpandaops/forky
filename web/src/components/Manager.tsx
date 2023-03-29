import { useMemo } from 'react';

import { MinusIcon } from '@heroicons/react/20/solid';
import { useQuery } from '@tanstack/react-query';

import WeightedStage from '@app/components/WeightedStage';
import { Response, V1GetEthereumNowResponse, V1MetadataListNodesResponse } from '@app/types/api';
import Logo from '@assets/logo.png';
import Control from '@components/Control';
import EpochDial from '@components/EpochDial';
import SlotDial from '@components/SlotDial';
import { Props } from '@hooks/useNetwork';
import useWindowSize from '@hooks/useWindowSize';
import FrameMetaProvider from '@providers/frameMeta';
import FramesProvider from '@providers/frames';
import NetworkProvider from '@providers/network';
import TimelineProvider from '@providers/timeline';

export default function Manager(props: Props) {
  // get hardcoded node
  const [width, height] = useWindowSize();
  const {
    data: dataNow,
    isLoading: isLoadingNow,
    error: errorNow,
  } = useQuery<Response<V1GetEthereumNowResponse>, Error>(
    ['ethereum', 'now'],
    async () => {
      const res = await fetch('/api/v1/ethereum/now');
      return res.json();
    },
    { refetchInterval: false },
  );
  const {
    data: dataMetadata,
    isLoading: isLoadingMetadata,
    error: errorMetadata,
  } = useQuery<Response<V1MetadataListNodesResponse>, Error>(
    ['metadata', 'list'],
    async () => {
      const res = await fetch('/api/v1/metadata/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {},
          pagination: {
            offset: 0,
            limit: 1,
          },
        }),
      });
      return res.json();
    },
    { refetchInterval: false },
  );

  const initialFocusedTime = useMemo<number | undefined>(() => {
    if (dataNow?.data?.slot) {
      return (
        props.genesisTime +
        dataNow.data.slot * (props.secondsPerSlot * 1000) -
        // offset minus 1 slot?
        props.secondsPerSlot * 1000
      );
    }
  }, [dataNow]);

  const firstNode = useMemo(() => {
    if (dataMetadata?.data?.nodes?.length) {
      return dataMetadata.data.nodes[0];
    }
  }, [dataMetadata]);

  // TODO: cleanup loading component
  if (isLoadingNow || isLoadingMetadata || errorNow || errorMetadata)
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-stone-900">
        <img src={Logo} className="object-contain w-72 h-72" />
        <h1 className="text-2xl text-white">
          {isLoadingNow || isLoadingMetadata
            ? 'Loading'
            : `Error: ${errorNow || errorMetadata || 'unexpected data returned'}`}
        </h1>
      </div>
    );

  if (!initialFocusedTime || !firstNode)
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-stone-900">
        <img src={Logo} className="object-contain w-72 h-72" />
        <h1 className="text-2xl text-white">
          {!firstNode ? 'No nodes found' : 'Failed to calculate initial focused time'}
        </h1>
      </div>
    );

  return (
    <NetworkProvider {...props} node={firstNode}>
      <FrameMetaProvider padding={3}>
        <FramesProvider>
          <TimelineProvider
            slotsPerEpoch={props.slotsPerEpoch}
            secondsPerSlot={props.secondsPerSlot}
            genesisTime={props.genesisTime}
            initialFocusedTime={initialFocusedTime}
          >
            <div className="w-screen h-screen overflow-hidden bg-stone-900 active:cursor-grabbing cursor-grab">
              <WeightedStage width={width} height={height - 50} />
            </div>
            <div className="fixed left-0 w-full bottom-1">
              <Control />
              <div className="grid grid-cols-1 border-t-8 border-stone-300">
                <EpochDial />
                <div className="relative select-none pt-1 bg-stone-300">
                  <span className="z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <MinusIcon className="mt-px rotate-90 h-8 w-8 ml-px text-stone-900" />
                  </span>
                </div>
                <SlotDial />
              </div>
            </div>
          </TimelineProvider>
        </FramesProvider>
      </FrameMetaProvider>
    </NetworkProvider>
  );
}
