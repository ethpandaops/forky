import { ReactNode } from 'react';

import classNames from 'clsx';

export default function Icon({
  className,
  text,
  size = 'sm',
  icon,
}: {
  className?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  icon: (className: string) => ReactNode;
}) {
  return (
    <span
      className={classNames(
        'flex items-center rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5 gap-2',
        `text-${size}`,
        size === 'sm' && 'p-2',
        size === 'md' && 'p-3',
        size === 'lg' && 'p-4',
        className,
      )}
    >
      {icon(
        classNames(
          size === 'sm' && 'h-6 w-6',
          size === 'md' && 'h-8 w-8',
          size === 'lg' && 'h-10 w-10',
        ),
      )}
      {text && <span className="pr-1">{text}</span>}
    </span>
  );
}
