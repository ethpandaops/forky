import { memo } from 'react';

import classNames from 'clsx';

import HoverCard from '@components/HoverCard';
import { WeightedNodeCard } from '@components/NodeCards';
import PayloadTide, { PayloadChip } from '@components/PayloadTide';
import ProgressCircle from '@components/ProgressCircle';
import { BlockPayload } from '@app/types/graph';
import { NODE_STYLES, NodeStyleKey } from '@utils/nodeStyles';
import { payloadProgress, payloadStage, PTC_SIZE, tideLevel } from '@utils/payload';

function WeightedNode({
  id,
  hash,
  weight,
  type,
  validity,
  x,
  y,
  radius,
  weightPercentageComparedToHeaviestNeighbor = 100,
  slot,
  epoch,
  parentRoot,
  payload,
  lead = false,
  className,
  onClick,
}: {
  id?: string;
  hash: string;
  weight: string;
  type: 'canonical' | 'fork' | 'finalized' | 'justified' | 'detached';
  validity: 'valid' | string;
  x: number;
  y: number;
  radius: number;
  weightPercentageComparedToHeaviestNeighbor?: number;
  slot?: number;
  epoch?: number;
  parentRoot?: string;
  payload?: BlockPayload;
  // a lead node (the newest slots) sloshes its Tide as the canvas is panned.
  lead?: boolean;
  className?: string;
  onClick?: (hash: string) => void;
}) {
  const styleKey = ((): NodeStyleKey => {
    if (!['valid', 'optimistic'].includes(validity.toLowerCase())) return 'invalid';
    if (type === 'detached') return 'invalid';
    if (type === 'canonical' && validity.toLowerCase() === 'optimistic') return 'optimistic';
    return type;
  })();
  const styles = NODE_STYLES[styleKey];

  const label =
    type === 'finalized' || type === 'justified' || type === 'detached'
      ? type.toUpperCase()
      : validity.toUpperCase();

  const handleActivate = () => onClick?.(hash);
  const stage = payload ? payloadStage(payload) : undefined;

  return (
    <HoverCard
      accent={styleKey}
      content={
        <WeightedNodeCard
          styleKey={styleKey}
          status={label}
          blockRoot={hash}
          parentRoot={parentRoot}
          slot={slot}
          epoch={epoch}
          validity={validity}
          weight={weight}
          weightPercentage={weightPercentageComparedToHeaviestNeighbor}
          payload={payload}
        />
      }
      referenceProps={{
        onClick: handleActivate,
        onKeyDown: event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleActivate();
          }
        },
      }}
    >
      {referenceProps => (
        <div
          id={id}
          role="button"
          tabIndex={0}
          {...referenceProps}
          className={classNames(
            'absolute flex cursor-pointer flex-col items-center justify-center gap-3 rounded-full transition-[filter] duration-150 hover:brightness-110',
            styles.fill,
            styles.glow,
            className,
          )}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${radius * 2}px`,
            height: `${radius * 2}px`,
          }}
        >
          {stage && payload && (
            <PayloadTide
              stage={stage}
              level={tideLevel(stage, payloadProgress(payload, stage))}
              slosh={lead}
            />
          )}
          <ProgressCircle
            progress={weightPercentageComparedToHeaviestNeighbor}
            radius={radius}
            className="absolute"
            color={styles.arc}
            backgroundColor={styles.track}
          />
          <p
            className={classNames(
              'relative mb-3 font-mono text-xl font-semibold uppercase tracking-widest',
              styles.label,
            )}
          >
            {label}
          </p>
          <p className="relative font-mono text-3xl font-semibold text-foreground-strong">
            {hash.substring(0, 6)}…{hash.substring(hash.length - 4)}
          </p>
          <p className="relative mt-3 font-mono text-xl tabular-nums text-foreground/70">
            {weight && weight !== '0' ? weight : ' '}
          </p>
          {stage && payload && (
            <PayloadChip
              stage={stage}
              value={stage === 'voting' ? `${payload.attesterCount}/${PTC_SIZE}` : undefined}
            />
          )}
        </div>
      )}
    </HoverCard>
  );
}

export default memo(WeightedNode);
