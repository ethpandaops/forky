import { useState, memo } from 'react';

import { EyeIcon, CheckIcon, FlagIcon } from '@heroicons/react/20/solid';
import classNames from 'clsx';

import ProgressCircle from '@components/ProgressCircle';

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
  className?: string;
  onClick?: (hash: string) => void;
}) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  const [color, backgroundColor, borderColor, title] = (() => {
    if (valid !== seen) {
      return [
        'text-invalid-ring',
        'text-invalid-deep',
        'border-invalid-edge',
        `${seen - valid} NOT VALID`,
      ];
    }

    if (orphans > 0) {
      return [
        'text-invalid-ring',
        'text-invalid-deep',
        'border-invalid-edge',
        `${orphans} DETACHED`,
      ];
    }

    if (finalizedCheckpoints > 0) {
      return ['text-finalized-ring', 'text-finalized-deep', 'border-finalized-edge', 'FINALIZED'];
    }

    if (justifiedCheckpoints > 0) {
      return ['text-justified-ring', 'text-justified-deep', 'border-justified-edge', 'JUSTIFIED'];
    }

    switch (type) {
      case 'canonical':
        if (optimistic > 0) {
          return [
            'text-optimistic-ring',
            'text-optimistic-deep',
            'border-optimistic-edge',
            `${optimistic}/${valid} OPTIMISTIC`,
          ];
        }
        return ['text-canonical-ring', 'text-canonical-deep', 'border-canonical-edge', 'VALID'];
      case 'fork':
        return [
          'text-fork-ring',
          'text-fork-deep',
          'border-fork-edge',
          optimistic > 0 ? `${optimistic}/${valid} OPTIMISTIC` : 'VALID',
        ];
      default:
        return ['text-canonical-ring', 'text-canonical-deep', 'border-canonical-edge', type];
    }
  })();

  return (
    <div
      id={id}
      className={classNames(
        'absolute flex flex-col items-center justify-center rounded-full cursor-pointer gap-3 shadow-inner-xl',
        borderColor,
        isHighlighted ? 'bg-track' : 'bg-field',
        className,
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        borderWidth: '16px',
      }}
      onClick={() => onClick?.(hash)}
      onMouseEnter={() => setIsHighlighted(true)}
      onMouseLeave={() => setIsHighlighted(false)}
    >
      <ProgressCircle
        progress={(canonical / total) * 100}
        radius={radius}
        className="absolute"
        color={color}
        backgroundColor={backgroundColor}
      />
      <p className="text-foreground-strong text-xl font-mono h-16 pt-6">{title}</p>
      <p className="text-foreground-strong text-2xl font-mono">
        {hash.substring(0, 6)}...{hash.substring(hash.length - 4)}
      </p>
      <p className="text-foreground-strong text-xl font-mono flex gap-5 h-16 pt-2">
        <span className="flex flex-col items-center gap-1">
          {finalizedCheckpoints > 0 || justifiedCheckpoints > 0 ? (
            <>
              <FlagIcon className="w-5 h-5" /> {finalizedCheckpoints || justifiedCheckpoints}/
              {total}
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" /> {canonical}/{total}
            </>
          )}
        </span>
        <span className="flex flex-col items-center gap-1">
          <EyeIcon className="w-5 h-5" /> {seen}/{total}
        </span>
      </p>
    </div>
  );
}

export default memo(AggregatedNode);
