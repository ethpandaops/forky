import { Fragment, useMemo } from 'react';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ReactTimeAgo from 'react-time-ago';

import { ForkChoiceNode, FrameMetaData } from '@app/types/api';
import useEthereum from '@contexts/ethereum';
import useSelection from '@contexts/selection';
import useActiveFrame from '@hooks/useActiveFrame';
import { useFrameQuery } from '@hooks/useQuery';
import { WeightedNodeAttributes } from '@utils/graph';
import { truncateHash } from '@utils/strings';

export default function Selection() {
  const { blockRoot, setBlockRoot } = useSelection();
  const { slotsPerEpoch } = useEthereum();

  const { id } = useActiveFrame();
  const { data } = useFrameQuery(id ?? '', Boolean(id));

  const { attributes, node, metadata } = useMemo<{
    attributes?: WeightedNodeAttributes;
    node?: ForkChoiceNode;
    metadata?: FrameMetaData;
  }>(() => {
    if (!blockRoot) return {};
    try {
      return {
        attributes: data?.graph?.getNodeAttributes(blockRoot),
        node: data?.frame.data.fork_choice_nodes?.find((n) => n.block_root === blockRoot),
        metadata: data?.frame.metadata,
      };
    } catch (err) {
      setBlockRoot();
      return {};
    }
  }, [data, blockRoot]);

  return (
    <div className="bg-stone-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <Transition.Root show={Boolean(blockRoot)} as={Fragment}>
          <Dialog as="div" onClose={() => setBlockRoot()}>
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-hidden z-30">
              <div className="absolute inset-0 overflow-hidden">
                <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                  <Transition.Child
                    as={Fragment}
                    enter="transform transition ease-in-out duration-100 sm:duration-200"
                    enterFrom="translate-x-full"
                    enterTo="translate-x-0"
                    leave="transform transition ease-in-out duration-100 sm:duration-200"
                    leaveFrom="translate-x-0"
                    leaveTo="translate-x-full"
                  >
                    <Dialog.Panel className="fixed inset-y-0 overflow-x-hidden right-0 w-full overflow-y-auto bg-stone-100 dark:bg-stone-900 sm:max-w-screen-lg sm:ring-1 sm:ring-white/10">
                      <div className="px-6 py-6">
                        <div className="flex flex-row-reverse">
                          <button
                            type="button"
                            className="mr-1.5 rounded-md p-1.5 text-stone-400 transition hover:bg-stone-900/5 dark:hover:bg-white/5"
                            onClick={() => setBlockRoot()}
                          >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="h-7 w-7" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="relative pt-10 pb-20 sm:py-12">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                          <div className="mx-auto max-w-2xl lg:max-w-4xl lg:px-12">
                            {attributes && node && metadata && (
                              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                                  <dl className="sm:divide-y sm:divide-gray-200">
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">Epoch</dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        {Math.floor(attributes.slot / slotsPerEpoch)}
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">Slot</dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        {attributes.slot}
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Snapshot Time
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        <ReactTimeAgo date={new Date(metadata.fetched_at)} />
                                        <span className="pl-1">({metadata.fetched_at})</span>
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Block Root
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        <span className="lg:hidden font-mono flex">
                                          <span className="relative top-1 group transition duration-300 cursor-pointer">
                                            {truncateHash(node.block_root)}
                                            <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                                          </span>
                                        </span>
                                        <span className="hidden lg:table-cell font-mono">
                                          {node.block_root}
                                        </span>
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Parent Root
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        <span className="lg:hidden font-mono flex">
                                          <span className="relative top-1 group transition duration-300 cursor-pointer">
                                            {truncateHash(node.parent_root)}
                                            <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                                          </span>
                                        </span>
                                        <span className="hidden lg:table-cell font-mono">
                                          {node.parent_root}
                                        </span>
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Execution Block Hash
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        <span className="lg:hidden font-mono flex">
                                          <span className="relative top-1 group transition duration-300 cursor-pointer">
                                            {truncateHash(node.execution_block_hash)}
                                            <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                                          </span>
                                        </span>
                                        <span className="hidden lg:table-cell font-mono">
                                          {node.execution_block_hash}
                                        </span>
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">Weight</dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        {node.weight}
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Validity
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        {node.validity}
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Justified Epoch
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        {node.justified_epoch}
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Finalized Epoch
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        {node.finalized_epoch}
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        State Root
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        <span className="lg:hidden font-mono flex">
                                          <span className="relative top-1 group transition duration-300 cursor-pointer">
                                            {truncateHash(node.extra_data.state_root)}
                                            <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                                          </span>
                                        </span>
                                        <span className="hidden lg:table-cell font-mono">
                                          {node.extra_data.state_root}
                                        </span>
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Justified Root
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        <span className="lg:hidden font-mono flex">
                                          <span className="relative top-1 group transition duration-300 cursor-pointer">
                                            {truncateHash(node.extra_data.justified_root)}
                                            <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                                          </span>
                                        </span>
                                        <span className="hidden lg:table-cell font-mono">
                                          {node.extra_data.justified_root}
                                        </span>
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Unrealized Justified Epoch
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        {node.extra_data.unrealised_justified_epoch}
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Unrealized Justified Root
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        <span className="lg:hidden font-mono flex">
                                          <span className="relative top-1 group transition duration-300 cursor-pointer">
                                            {truncateHash(
                                              node.extra_data.unrealized_justified_root,
                                            )}
                                            <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                                          </span>
                                        </span>
                                        <span className="hidden lg:table-cell font-mono">
                                          {node.extra_data.unrealized_justified_root}
                                        </span>
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Unrealized Finalized Epoch
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        {node.extra_data.unrealised_finalized_epoch}
                                      </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500">
                                        Unrealized Finalized Root
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                                        <span className="lg:hidden font-mono flex">
                                          <span className="relative top-1 group transition duration-300 cursor-pointer">
                                            {truncateHash(
                                              node.extra_data.unrealized_finalized_root,
                                            )}
                                            <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                                          </span>
                                        </span>
                                        <span className="hidden lg:table-cell font-mono">
                                          {node.extra_data.unrealized_finalized_root}
                                        </span>
                                      </dd>
                                    </div>
                                  </dl>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </header>
    </div>
  );
}
/* 
extra_data
  state_root: string;
  justified_root: string;
  unrealised_justified_epoch: string;
  unrealized_justified_root: string;
  unrealised_finalized_epoch: string;
  unrealized_finalized_root: string;

*/
