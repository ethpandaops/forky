import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import ReactTimeAgo from 'react-time-ago';
import { Link } from 'wouter';

import Download from '@components/Download';
import Loading from '@components/Loading';
import useSelection from '@contexts/selection';
import { useFrameQuery } from '@hooks/useQuery';

function parseLabel(label: string): [string, string | undefined] {
  const [key, value] = label.split('=', 2);
  return [key, value];
}

export default function FrameSummary({ id }: { id: string }) {
  const { clearAll } = useSelection();
  const { data, isLoading, error } = useFrameQuery(id);
  if (isLoading) {
    return <Loading message="Loading..." />;
  }

  if (!data || error) {
    return <Loading message={`Error: ${error ?? 'failed to load snapshot'}`} />;
  }

  return (
    <>
      <div className="bg-stone-50 dark:bg-stone-800 shadow dark:shadow-inner">
        <div className="border-t border-stone-200 dark:border-b dark:border-stone-800 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-stone-200 dark:divide-stone-900">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">ID</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4 font-semibold underline">
                <Link href={`/snapshot/${data.frame.metadata.id}`} onClick={clearAll}>
                  {data.frame.metadata.id}
                </Link>
                <ArrowTopRightOnSquareIcon className="inline h-5 w-5 pl-1" />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Taken at</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                <ReactTimeAgo date={new Date(data.frame.metadata.fetched_at)} />
                <span className="pl-1">
                  ({new Date(data.frame.metadata.fetched_at).toISOString()})
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Source</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4 font-semibold underline">
                <Link href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
                  {data.frame.metadata.node}
                </Link>
                <ArrowTopRightOnSquareIcon className="inline h-5 w-5 pl-1" />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">
                Wall clock Epoch
              </dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                {data.frame.metadata.wall_clock_epoch}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">
                Wall clock slot
              </dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                {data.frame.metadata.wall_clock_slot}
              </dd>
            </div>
            {data.frame.metadata.labels && (
              <>
                <div className="py-4 sm:py-5 sm:px-6 flex justify-center sm:justify-start sm:bg-stone-100 sm:dark:bg-stone-900">
                  <dt className="text-md text-stone-500 dark:text-stone-300 font-bold">Labels</dt>
                </div>
                {data.frame.metadata.labels?.map((label) => {
                  const [key, value] = parseLabel(label);
                  return (
                    <div key={key} className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-stone-500 dark:text-stone-300 capitalize">
                        {key.replaceAll('_', ' ')}
                      </dt>
                      <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                        {value}
                      </dd>
                    </div>
                  );
                })}
              </>
            )}
          </dl>
        </div>
      </div>
      <div className="w-full sm:mt-5 flex justify-center items-center text-stone-900 dark:text-stone-100">
        <Download
          data={JSON.stringify(data.frame, null, 2)}
          filename={`snapshot-${data.frame.metadata.id}.json`}
          size="md"
          text="Snapshot"
        />
      </div>
    </>
  );
}
