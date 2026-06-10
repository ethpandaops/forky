import { memo } from 'react';

import { RectangleGroupIcon, RectangleStackIcon } from '@heroicons/react/24/solid';
import Link from '@components/Link';

import Download from '@components/Download';
import useAction from '@hooks/useActive';
import { useFrameQuery } from '@hooks/useQuery';

function FrameFooter() {
  const { ids } = useAction();
  const { data } = useFrameQuery(ids[0], ids.length > 0);

  return (
    <div className="glass-chrome fixed bottom-0 left-0 h-24 w-full border-t border-border">
      <div className="flex h-full items-center justify-center gap-x-8 text-foreground">
        <Link
          href="/"
          className="group flex flex-col items-center gap-1 font-mono text-[10px]/4 uppercase tracking-widest text-muted transition-colors duration-150 hover:text-foreground"
        >
          <span className="flex items-center rounded-lg p-3 transition-colors duration-150 group-hover:bg-overlay/5">
            <RectangleGroupIcon className="size-8" />
          </span>
          Aggregated View
        </Link>
        {data && (
          <>
            <Link
              href={`/node/${data.frame.metadata.node}`}
              className="group flex flex-col items-center gap-1 font-mono text-[10px]/4 uppercase tracking-widest text-muted transition-colors duration-150 hover:text-foreground"
            >
              <span className="flex items-center rounded-lg p-3 transition-colors duration-150 group-hover:bg-overlay/5">
                <RectangleStackIcon className="size-8" />
              </span>
              Source View
            </Link>
            <span className="hidden flex-col items-center gap-1 font-mono text-[10px]/4 uppercase tracking-widest text-muted sm:flex">
              <Download
                data={JSON.stringify(data.frame)}
                filename={`snapshot-${data.frame.metadata.id}.json`}
                size="md"
              />
              Download
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(FrameFooter);
