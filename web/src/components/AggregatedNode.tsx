import { memo } from 'react';

import { EyeIcon, CheckIcon, FlagIcon } from '@heroicons/react/20/solid';
import classNames from 'clsx';

import HoverCard from '@components/HoverCard';
import { AggregatedNodeCard } from '@components/NodeCards';
import ProgressCircle from '@components/ProgressCircle';
import { NODE_STYLES, NodeStyleKey } from '@utils/nodeStyles';

function AggregatedNode({
  id,
  hash,
  type,
  seen,
  canonical,
  finalizedCheckpoints,
  justifiedCheckpoints,
  orphans,
  valid,
  optimistic,
  total,
  x,
  y,
  radius,
  slot,
  epoch,
  className,
  onClick,
}: {
  id?: string;
  hash: string;
  type: 'canonical' | 'fork';
  seen: number;
  canonical: number;
  finalizedCheckpoints: number;
  justifiedCheckpoints: number;
  orphans: number;
  valid: number;
  optimistic: number;
  total: number;
  x: number;
  y: number;
  radius: number;
  slot?: number;
  epoch?: number;
  className?: string;
  onClick?: (hash: string) => void;
}) {
  const [styleKey, title] = ((): [NodeStyleKey, string] => {
    if (valid !== seen) return ['invalid', `${seen - valid} NOT VALID`];
    if (orphans > 0) return ['invalid', `${orphans} DETACHED`];
    if (finalizedCheckpoints > 0) return ['finalized', 'FINALIZED'];
    if (justifiedCheckpoints > 0) return ['justified', 'JUSTIFIED'];

    switch (type) {
      case 'canonical':
        if (optimistic > 0) return ['optimistic', `${optimistic}/${valid} OPTIMISTIC`];
        return ['canonical', 'VALID'];
      case 'fork':
        return ['fork', optimistic > 0 ? `${optimistic}/${valid} OPTIMISTIC` : 'VALID'];
      default:
        return ['canonical', type];
    }
  })();
  const styles = NODE_STYLES[styleKey];

  const handleActivate = () => onClick?.(hash);

  return (
    <HoverCard
      accent={styleKey}
      content={
        <AggregatedNodeCard
          styleKey={styleKey}
          status={title}
          blockRoot={hash}
          slot={slot}
          epoch={epoch}
          seen={seen}
          canonical={canonical}
          finalizedCheckpoints={finalizedCheckpoints}
          justifiedCheckpoints={justifiedCheckpoints}
          orphans={orphans}
          valid={valid}
          optimistic={optimistic}
          total={total}
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
          <ProgressCircle
            progress={(canonical / total) * 100}
            radius={radius}
            className="absolute"
            color={styles.arc}
            backgroundColor={styles.track}
          />
          <p
            className={classNames(
              'h-16 pt-6 font-mono text-xl font-semibold uppercase tracking-widest',
              styles.label,
            )}
          >
            {title}
          </p>
          <p className="font-mono text-3xl font-semibold text-foreground-strong">
            {hash.substring(0, 6)}…{hash.substring(hash.length - 4)}
          </p>
          <p className="flex h-16 gap-6 pt-2 font-mono text-xl tabular-nums text-foreground/70">
            <span className="flex flex-col items-center gap-1">
              {finalizedCheckpoints > 0 || justifiedCheckpoints > 0 ? (
                <>
                  <FlagIcon className="size-5" /> {finalizedCheckpoints || justifiedCheckpoints}/
                  {total}
                </>
              ) : (
                <>
                  <CheckIcon className="size-5" /> {canonical}/{total}
                </>
              )}
            </span>
            <span className="flex flex-col items-center gap-1">
              <EyeIcon className="size-5" /> {seen}/{total}
            </span>
          </p>
        </div>
      )}
    </HoverCard>
  );
}

export default memo(AggregatedNode);
