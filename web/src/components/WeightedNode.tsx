import { useState, memo } from 'react';

import classNames from 'classnames';

import ProgressCircle from '@components/ProgressCircle';

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
  className?: string;
  onClick?: (hash: string) => void;
}) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  const [color, backgroundColor, borderColor] = (() => {
    if (!['valid', 'optimistic'].includes(validity.toLowerCase())) {
      return ['text-red-600', 'text-red-800', 'border-red-500 dark:border-red-900'];
    }
    switch (type) {
      case 'canonical':
        if (validity.toLowerCase() === 'optimistic') {
          return ['text-yellow-600', 'text-yellow-800', 'border-yellow-500 dark:border-yellow-900'];
        }
        return [
          'text-emerald-600',
          'text-emerald-800',
          'border-emerald-500 dark:border-emerald-900',
        ];
      case 'fork':
        return ['text-amber-600', 'text-amber-800', 'border-amber-500 dark:border-amber-900'];
      case 'finalized':
        return [
          'text-fuchsia-600',
          'text-fuchsia-800',
          'border-fuchsia-500 dark:border-fuchsia-900',
        ];
      case 'justified':
        return ['text-indigo-600', 'text-indigo-800', 'border-indigo-500 dark:border-indigo-900'];
      case 'detached':
        return ['text-red-600', 'text-red-800', 'border-red-500 dark:border-red-900'];
      default:
        return [
          'text-emerald-600',
          'text-emerald-800',
          'border-emerald-500 dark:border-emerald-900',
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
        progress={weightPercentageComparedToHeaviestNeighbor}
        radius={radius}
        className="absolute"
        color={color}
        backgroundColor={backgroundColor}
      />
      <p className="text-stone-950 dark:text-stone-50 text-xl font-mono mb-3">
        {type === 'finalized' || type === 'justified' || type === 'detached'
          ? type.toUpperCase()
          : validity.toUpperCase()}
      </p>
      <p className="text-stone-950 dark:text-stone-50 text-2xl font-mono">
        {hash.substring(0, 6)}...{hash.substring(hash.length - 4)}
      </p>
      <p
        className={classNames(
          'text-stone-950 dark:text-stone-50 text-xl font-mono mt-3',
          weight.length < 22 ? 'text-xl' : '',
        )}
      >
        {weight && weight !== '0' ? weight : '\u00a0'}
      </p>
    </div>
  );
}

export default memo(WeightedNode);
