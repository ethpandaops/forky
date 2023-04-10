import { MinusIcon } from '@heroicons/react/20/solid';

import Control from '@components/Control';
import EpochDial from '@components/EpochDial';
import SlotDial from '@components/SlotDial';

export default function Timeline() {
  return (
    <div className="fixed left-0 w-full bottom-0">
      <Control />
      <div className="grid grid-cols-1 xl:border-t-8 border-stone-300 dark:border-stone-600">
        <div className="hidden xl:block">
          <EpochDial />
        </div>
        <div className="relative select-none pt-1 bg-stone-300 dark:bg-stone-600">
          <span className="hidden xl:block z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MinusIcon className="mt-px rotate-90 h-8 w-8 ml-px text-stone-700 dark:text-stone-50" />
          </span>
          <span className="xl:hidden z-10 absolute left-1/2 transform -translate-x-1/2 -translate-y-2 max-h-5 overflow-y-hidden">
            <MinusIcon className="mt-px rotate-90 w-8 ml-px text-stone-700 dark:text-stone-50" />
          </span>
        </div>
        <SlotDial />
      </div>
    </div>
  );
}
