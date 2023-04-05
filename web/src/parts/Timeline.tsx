import { MinusIcon } from '@heroicons/react/20/solid';

import Control from '@components/Control';
import EpochDial from '@components/EpochDial';
import SlotDial from '@components/SlotDial';

export default function Timeline() {
  return (
    <div className="fixed left-0 w-full bottom-0">
      <Control />
      <div className="grid grid-cols-1 border-t-8 border-stone-300">
        <EpochDial />
        <div className="relative select-none pt-1 bg-stone-300">
          <span className="z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MinusIcon className="mt-px rotate-90 h-8 w-8 ml-px text-stone-900" />
          </span>
        </div>
        <SlotDial />
      </div>
    </div>
  );
}
