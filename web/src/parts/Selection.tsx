import { Fragment, useEffect } from 'react';

import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { useLocation } from 'wouter';

import AggregatedBlockSummary from '@components/AggregatedBlockSummary';
import AggregatedFramesSummary from '@components/AggregatedFramesSummary';
import BYOFrameBlockSummary from '@components/BYOFrameBlockSummary';
import FrameBlockSummary from '@components/FrameBlockSummary';
import FrameSummary from '@components/FrameSummary';
import useSelection from '@contexts/selection';

export default function Selection() {
  const { frameId, aggregatedFrameIds, frameBlock, aggregatedFramesBlock, clearAll } =
    useSelection();
  const [location] = useLocation();
  const isBYO = location.startsWith('/byo');

  useEffect(clearAll, [location]);

  return (
    <div className="bg-stone-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <Transition
          show={
            Boolean(frameId) ||
            Boolean(aggregatedFrameIds) ||
            Boolean(frameBlock) ||
            Boolean(aggregatedFramesBlock)
          }
          as={Fragment}
        >
          <Dialog as="div" onClose={clearAll}>
            <TransitionChild
              as={Fragment}
              enter="ease-in-out duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-30" />
            </TransitionChild>
            <div className="fixed inset-0 overflow-hidden z-30">
              <div className="absolute inset-0 overflow-hidden">
                <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                  <TransitionChild
                    as={Fragment}
                    enter="transform transition ease-in-out duration-100 sm:duration-200"
                    enterFrom="translate-x-full"
                    enterTo="translate-x-0"
                    leave="transform transition ease-in-out duration-100 sm:duration-200"
                    leaveFrom="translate-x-0"
                    leaveTo="translate-x-full"
                  >
                    <DialogPanel
                      className={classNames(
                        'fixed inset-y-0 overflow-x-hidden right-0 w-full overflow-y-auto bg-stone-100 dark:bg-stone-900 sm:ring-1 sm:ring-white/10',
                        aggregatedFrameIds ? 'sm:max-w-[95%]' : 'sm:max-w-screen-lg',
                      )}
                    >
                      <div className="flex h-full flex-col py-6 shadow-xl">
                        <div className="px-4 mb-6 mt-1 sm:px-6">
                          <div className="flex items-start justify-between">
                            <DialogTitle className="mt-1 flex items-center text-base font-semibold leading-6 text-stone-900 dark:text-stone-100">
                              {frameId && 'Snapshot'}
                              {aggregatedFrameIds && 'Aggregated Snapshots'}
                              {frameBlock && 'Block'}
                              {aggregatedFramesBlock && 'Aggregated Block'}
                            </DialogTitle>
                            <div className="ml-3 flex h-7 items-center">
                              <button
                                type="button"
                                className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-900/5 dark:hover:bg-white/5"
                                onClick={clearAll}
                              >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon className="h-7 w-7" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                        {frameId && <FrameSummary id={frameId} />}
                        {aggregatedFrameIds && <AggregatedFramesSummary ids={aggregatedFrameIds} />}
                        {frameBlock && !isBYO && <FrameBlockSummary {...frameBlock} />}
                        {frameBlock && isBYO && <BYOFrameBlockSummary {...frameBlock} />}
                        {aggregatedFramesBlock && (
                          <AggregatedBlockSummary {...aggregatedFramesBlock} />
                        )}
                      </div>
                    </DialogPanel>
                  </TransitionChild>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition>
      </header>
    </div>
  );
}
