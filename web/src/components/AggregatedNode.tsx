import { useState, memo } from 'react';

import { EyeIcon, CheckIcon, FlagIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';

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
        'text-red-600',
        'text-red-800',
        'border-red-500 dark:border-red-900',
        `${seen - valid} NOT VALID`,
      ];
    }

    if (orphans > 0) {
      return [
        'text-red-600',
        'text-red-800',
        'border-red-500 dark:border-red-900',
        `${orphans} DETACHED`,
      ];
    }

    if (finalizedCheckpoints > 0) {
      return [
        'text-fuchsia-600',
        'text-fuchsia-800',
        'border-fuchsia-500 dark:border-fuchsia-900',
        'FINALIZED',
      ];
    }

    if (justifiedCheckpoints > 0) {
      return [
        'text-indigo-600',
        'text-indigo-800',
        'border-indigo-500 dark:border-indigo-900',
        'JUSTIFIED',
      ];
    }

    switch (type) {
      case 'canonical':
        return [
          'text-emerald-600',
          'text-emerald-800',
          'border-emerald-500 dark:border-emerald-900',
          'VALID',
        ];
      case 'fork':
        return [
          'text-amber-600',
          'text-amber-800',
          'border-amber-500 dark:border-amber-900',
          'VALID',
        ];
      default:
        return [
          'text-emerald-600',
          'text-emerald-800',
          'border-emerald-500 dark:border-emerald-900',
          type,
        ];
    }
  })();

  return (
    <div
      id={id}
      className={classNames(
        'absolute flex flex-col items-center justify-center rounded-full cursor-pointer gap-3 shadow-inner-xl',
        borderColor,
        isHighlighted ? 'bg-stone-300 dark:bg-stone-500' : 'bg-stone-200 dark:bg-stone-600',
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
      <p className="text-stone-950 dark:text-stone-50 text-xl font-mono h-16 pt-6">{title}</p>
      <p className="text-stone-950 dark:text-stone-50 text-2xl font-mono">
        {hash.substring(0, 6)}...{hash.substring(hash.length - 4)}
      </p>
      <p className="text-stone-950 dark:text-stone-50 text-xl font-mono flex gap-5 h-16 pt-2">
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
