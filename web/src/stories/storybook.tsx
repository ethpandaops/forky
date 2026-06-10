/* eslint-disable react-refresh/only-export-components */
import { ReactNode, useEffect } from 'react';

import type { Decorator } from '@storybook/tanstack-react';
import classNames from 'clsx';

import type { ProcessedData } from '@app/types/graph';
import useFocus from '@contexts/focus';
import useSelection, { AggregatedFramesBlock, FrameBlock } from '@contexts/selection';
import ApplicationProvider from '@providers/application';
import {
  getProcessedStoryFrame,
  storyFrameIds,
  storyNetworkName,
  storyNow,
  storySpec,
} from '@app/stories/fixtures';

const storyGenesisTime = new Date(storySpec.genesis_time).getTime();

export const defaultEthereumProps = {
  genesisTime: storyGenesisTime,
  secondsPerSlot: storySpec.seconds_per_slot,
  slotsPerEpoch: storySpec.slots_per_epoch,
  networkName: storyNetworkName,
};

export const defaultFocusProps = {
  initialTime: storyGenesisTime + (storyNow.slot - 2) * storySpec.seconds_per_slot * 1000,
  playing: false,
  byo: false,
};

export function StorySurface({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={classNames(
        'min-h-screen bg-background text-foreground',
        padded && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelSurface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <StorySurface className={classNames('flex items-start justify-center', className)}>
      <div className="w-full max-w-5xl">{children}</div>
    </StorySurface>
  );
}

export function withForkyProviders({
  focus,
}: {
  focus?: Partial<typeof defaultFocusProps> & {
    node?: string;
    frameId?: string;
    byoData?: ProcessedData;
  };
} = {}): Decorator {
  return Story => {
    const { byoData, ...focusProps } = focus ?? {};
    return (
      <ApplicationProvider
        ethereum={defaultEthereumProps}
        focus={{
          ...defaultFocusProps,
          ...focusProps,
        }}
      >
        {byoData && <BYODataSeeder data={byoData} />}
        <Story />
      </ApplicationProvider>
    );
  };
}

export function BYODataSeeder({ data }: { data: ProcessedData }) {
  const { setBYOData } = useFocus();

  useEffect(() => {
    setBYOData(data);
    return () => setBYOData(undefined);
  }, [data, setBYOData]);

  return null;
}

export function SelectionSeeder({
  frameId,
  aggregatedFrameIds,
  frameBlock,
  aggregatedFramesBlock,
}: {
  frameId?: string;
  aggregatedFrameIds?: string[];
  frameBlock?: FrameBlock;
  aggregatedFramesBlock?: AggregatedFramesBlock;
}) {
  const { clearAll, setAggregatedFrameIds, setAggregatedFramesBlock, setFrameBlock, setFrameId } =
    useSelection();

  useEffect(() => {
    if (frameId) setFrameId(frameId);
    else if (aggregatedFrameIds) setAggregatedFrameIds(aggregatedFrameIds);
    else if (frameBlock) setFrameBlock(frameBlock);
    else if (aggregatedFramesBlock) setAggregatedFramesBlock(aggregatedFramesBlock);
    else clearAll();

    return clearAll;
  }, [
    aggregatedFrameIds,
    aggregatedFramesBlock,
    clearAll,
    frameBlock,
    frameId,
    setAggregatedFrameIds,
    setAggregatedFramesBlock,
    setFrameBlock,
    setFrameId,
  ]);

  return null;
}

export const defaultBYOData = getProcessedStoryFrame(storyFrameIds[0]);
