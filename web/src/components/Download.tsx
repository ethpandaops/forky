import { ArrowDownTrayIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';

export default function Download({
  data,
  filename,
  className,
  type = 'text/json',
  text,
  size = 'sm',
}: {
  data: string;
  filename: string;
  className?: string;
  type?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <a
      href={`data:${type};charset=utf-8,${encodeURIComponent(data)}`}
      download={filename}
      className={classNames(
        'flex items-center rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5 gap-2',
        `text-${size}`,
        size === 'sm' && 'p-2',
        size === 'md' && 'p-3',
        size === 'lg' && 'p-4',
        className,
      )}
    >
      <ArrowDownTrayIcon
        className={classNames(
          size === 'sm' && 'h-6 w-6',
          size === 'md' && 'h-8 w-8',
          size === 'lg' && 'h-10 w-10',
        )}
      />
      {text && <span className="pr-1">{text}</span>}
    </a>
  );
}
