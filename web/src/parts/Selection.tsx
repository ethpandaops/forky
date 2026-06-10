import { useEffect } from 'react';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'clsx';
import { usePathname } from '@hooks/useAppNavigation';

import AggregatedBlockSummary from '@components/AggregatedBlockSummary';
import AggregatedFramesSummary from '@components/AggregatedFramesSummary';
import BYOFrameBlockSummary from '@components/BYOFrameBlockSummary';
import FrameBlockSummary from '@components/FrameBlockSummary';
import FrameSummary from '@components/FrameSummary';
import useSelection from '@contexts/selection';

export default function Selection() {
  const { frameId, aggregatedFrameIds, frameBlock, aggregatedFramesBlock, clearAll } =
    useSelection();
  const location = usePathname();
  const isBYO = location.startsWith('/byo');

  useEffect(clearAll, [location, clearAll]);

  return (
    <div className="bg-shell">
      <header className="absolute inset-x-0 top-0 z-20">
        <Dialog
          open={
            Boolean(frameId) ||
            Boolean(aggregatedFrameIds) ||
            Boolean(frameBlock) ||
            Boolean(aggregatedFramesBlock)
          }
          onClose={clearAll}
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 z-30 bg-scrim backdrop-blur-xs transition-opacity duration-150 ease-out data-[closed]:opacity-0"
          />
          <div className="fixed inset-0 overflow-hidden z-30">
            <div className="absolute inset-0 overflow-hidden">
              <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <DialogPanel
                  transition
                  className={classNames(
                    'fixed inset-y-0 overflow-x-hidden right-0 w-full overflow-y-auto bg-background border-l border-border transform transition ease-out duration-150 sm:duration-200 data-[closed]:translate-x-full',
                    aggregatedFrameIds ? 'sm:max-w-[95%]' : 'sm:max-w-3xl',
                  )}
                >
                  <div className="flex h-full flex-col">
                    <div className="glass-chrome sticky top-0 z-10 flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
                      <DialogTitle className="font-mono text-xs/6 font-semibold uppercase tracking-widest text-foreground">
                        {frameId && 'Snapshot'}
                        {aggregatedFrameIds && 'Aggregated Snapshots'}
                        {frameBlock && 'Block'}
                        {aggregatedFramesBlock && 'Aggregated Block'}
                      </DialogTitle>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-faint transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground"
                        onClick={clearAll}
                      >
                        <span className="sr-only">Close menu</span>
                        <XMarkIcon className="size-5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex-1 py-4">
                      {frameId && <FrameSummary id={frameId} />}
                      {aggregatedFrameIds && <AggregatedFramesSummary ids={aggregatedFrameIds} />}
                      {frameBlock && !isBYO && <FrameBlockSummary {...frameBlock} />}
                      {frameBlock && isBYO && <BYOFrameBlockSummary {...frameBlock} />}
                      {aggregatedFramesBlock && (
                        <AggregatedBlockSummary {...aggregatedFramesBlock} />
                      )}
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </div>
        </Dialog>
      </header>
    </div>
  );
}
