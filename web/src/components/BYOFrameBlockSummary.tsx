import ReactTimeAgo from 'react-time-ago';

import Download from '@components/Download';
import Loading from '@components/Loading';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import { FrameBlock } from '@contexts/selection';
import { truncateHash } from '@utils/strings';

export default function BYOFrameBlockSummary({ blockRoot }: FrameBlock) {
  const { byoData: data } = useFocus();
  const { slotsPerEpoch } = useEthereum();

  if (!data) {
    return <Loading message="Error: failed to load graph data" />;
  }

  const node = data.frame?.data?.fork_choice_nodes?.find(n => n.block_root === blockRoot);

  if (!node) {
    return <Loading message="Error: failed to find block root in snapshot" />;
  }

  return (
    <>
      <div className="bg-stone-50 dark:bg-stone-800 shadow dark:shadow-inner">
        <div className="border-t border-stone-200 dark:border-b dark:border-stone-800 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-stone-200 dark:divide-stone-900">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Epoch</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                {Math.floor(Number.parseInt(node.slot) / slotsPerEpoch)}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Slot</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                {node.slot}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">
                Snapshot Time
              </dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                <ReactTimeAgo date={new Date(data.frame.metadata.fetched_at)} />
                <span className="pl-1">({data.frame.metadata.fetched_at})</span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Block Root</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                <span className="lg:hidden font-mono flex">
                  <span className="relative top-1 group transition duration-300 cursor-pointer">
                    {truncateHash(node.block_root)}
                    <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                  </span>
                </span>
                <span className="hidden lg:table-cell font-mono">{node.block_root}</span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">
                Parent Root
              </dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                <span className="lg:hidden font-mono flex">
                  <span className="relative top-1 group transition duration-300 cursor-pointer">
                    {truncateHash(node.parent_root)}
                    <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                  </span>
                </span>
                <span className="hidden lg:table-cell font-mono">{node.parent_root}</span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">
                Execution Block Hash
              </dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                <span className="lg:hidden font-mono flex">
                  <span className="relative top-1 group transition duration-300 cursor-pointer">
                    {truncateHash(node.execution_block_hash)}
                    <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                  </span>
                </span>
                <span className="hidden lg:table-cell font-mono">{node.execution_block_hash}</span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Weight</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                {node.weight}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Validity</dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                {node.validity}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">
                Justified Epoch
              </dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                {node.justified_epoch}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">
                Finalized Epoch
              </dt>
              <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                {node.finalized_epoch}
              </dd>
            </div>
            {node.extra_data && (
              <>
                <div className="py-4 sm:py-5 sm:px-6 flex justify-center sm:justify-start sm:bg-stone-100 sm:dark:bg-stone-900">
                  <dt className="text-md text-stone-500 dark:text-stone-300 font-bold">
                    Extra data
                  </dt>
                </div>
                {Object.entries(node.extra_data).map(([key, value]) => (
                  <div key={key} className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-stone-500 dark:text-stone-300 capitalize">
                      {key.replaceAll('_', ' ')}
                    </dt>
                    <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
                      {`${value}`}
                    </dd>
                  </div>
                ))}
              </>
            )}
          </dl>
        </div>
      </div>
      <div className="w-full sm:mt-5 flex justify-center items-center text-stone-900 dark:text-stone-100 gap-5">
        <Download
          data={JSON.stringify(node, null, 2)}
          filename={`block-${node.block_root}.json`}
          size="md"
          text="Block"
        />
        <Download
          data={JSON.stringify(data.frame.data, null, 2)}
          filename={`snapshot-byo.json`}
          size="md"
          text="Snapshot"
        />
      </div>
    </>
  );
}
