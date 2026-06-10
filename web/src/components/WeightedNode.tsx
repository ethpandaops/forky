import { useState, memo } from 'react';

import classNames from 'clsx';

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
      return ['text-invalid-ring', 'text-invalid-deep', 'border-invalid-edge'];
    }
    switch (type) {
      case 'canonical':
        if (validity.toLowerCase() === 'optimistic') {
          return ['text-optimistic-ring', 'text-optimistic-deep', 'border-optimistic-edge'];
        }
        return ['text-canonical-ring', 'text-canonical-deep', 'border-canonical-edge'];
      case 'fork':
        return ['text-fork-ring', 'text-fork-deep', 'border-fork-edge'];
      case 'finalized':
        return ['text-finalized-ring', 'text-finalized-deep', 'border-finalized-edge'];
      case 'justified':
        return ['text-justified-ring', 'text-justified-deep', 'border-justified-edge'];
      case 'detached':
        return ['text-invalid-ring', 'text-invalid-deep', 'border-invalid-edge'];
      default:
        return ['text-canonical-ring', 'text-canonical-deep', 'border-canonical-edge'];
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
        progress={weightPercentageComparedToHeaviestNeighbor}
        radius={radius}
        className="absolute"
        color={color}
        backgroundColor={backgroundColor}
      />
      <p className="text-foreground-strong text-xl font-mono mb-3">
        {type === 'finalized' || type === 'justified' || type === 'detached'
          ? type.toUpperCase()
          : validity.toUpperCase()}
      </p>
      <p className="text-foreground-strong text-2xl font-mono">
        {hash.substring(0, 6)}...{hash.substring(hash.length - 4)}
      </p>
      <p
        className={classNames(
          'text-foreground-strong text-xl font-mono mt-3',
          weight.length < 22 ? 'text-xl' : '',
        )}
      >
        {weight && weight !== '0' ? weight : '\u00a0'}
      </p>
    </div>
  );
}

export default memo(WeightedNode);
