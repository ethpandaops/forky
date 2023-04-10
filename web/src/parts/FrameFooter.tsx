import { memo } from 'react';

import { RectangleGroupIcon, RectangleStackIcon } from '@heroicons/react/24/solid';
import { useLocation, Link } from 'wouter';

import Download from '@components/Download';
import useAction from '@hooks/useActive';
import { useFrameQuery } from '@hooks/useQuery';

function FrameFooter() {
  const { ids } = useAction();
  const [location, setLocation] = useLocation();
  const { data, isLoading } = useFrameQuery(ids[0], ids.length > 0);

  return (
    <div
      className="fixed left-0 w-full bottom-0 bg-stone-300 dark:bg-stone-800"
      style={{ height: 148 }}
    >
      <div className="flex h-full items-center justify-center text-stone-900 dark:text-stone-100 gap-x-10">
        <Link href="/" className="flex flex-col items-center">
          <span className="flex items-center rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5 gap-2 text-lg p-4">
            <RectangleGroupIcon className="h-10 w-10" />
          </span>
          Aggregated View
        </Link>
        {data && (
          <>
            <Link href={`/node/${data.frame.metadata.node}`} className="flex flex-col items-center">
              <span className="flex items-center rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5 gap-2 text-lg p-4">
                <RectangleStackIcon className="h-10 w-10" />
              </span>
              Source View
            </Link>
            <span className="flex-col items-center hidden sm:flex">
              <Download
                data={JSON.stringify(data.frame)}
                filename={`${data.frame.metadata.id}.json`}
                size="lg"
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
