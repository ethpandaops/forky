import { memo, useRef } from 'react';

import {
  ArrowUturnRightIcon,
  ArrowUturnLeftIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/20/solid';

import EditableInput from '@components/EditableInput';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import useOutsideInteraction from '@hooks/useOutsideInteraction';

function TimelineControl() {
  const controlRef = useRef<HTMLDivElement>(null);
  const blurAllInputs = () => {
    const inputs = controlRef.current?.querySelectorAll('input');
    inputs?.forEach(input => input.blur());
  };
  useOutsideInteraction(controlRef as React.RefObject<HTMLElement>, blurAllInputs);

  const {
    setTime: setFocusedTime,
    setSlot: setCurrentSlot,
    setEpoch: setCurrentEpoch,
    time: focusedTime,
    slot: focusedSlot,
    epoch: focusedEpoch,
    timeIntoSlot: focusedTimeIntoSlot,
    play: playTimer,
    stop: stopTimer,
    playing,
  } = useFocus();
  const { genesisTime, secondsPerSlot } = useEthereum();

  const slotDiff = Math.floor((Date.now() - genesisTime) / 1000 / secondsPerSlot) - focusedSlot;
  const isCloseToLiveSlot = slotDiff <= 3 && slotDiff >= -1;

  const handleBack = () => {
    if (focusedTimeIntoSlot > 500) {
      setFocusedTime(focusedTime - focusedTimeIntoSlot);
    } else {
      setCurrentSlot(focusedSlot - 1);
    }
  };

  const handleForward = () => {
    setCurrentSlot(focusedSlot + 1);
  };

  const handleLive = () => {
    if (!isCloseToLiveSlot) {
      setCurrentSlot(Math.floor((Date.now() - genesisTime) / 1000 / secondsPerSlot) - 2);
      playTimer();
    } else if (!playing) {
      playTimer();
    }
  };

  return (
    <div ref={controlRef} className="flex justify-center">
      <div className="flex gap-x-8 w-full h-12 xl:h-16 xl:w-fit bg-stone-200 dark:bg-stone-700 px-3 xl:py-3 xl:rounded-t-xl justify-center items-center">
        <div className="relative hidden md:block">
          <label
            htmlFor="slot"
            className="absolute -top-2 left-2 inline-block bg-stone-300 dark:bg-stone-500 rounded px-1 text-xs font-medium text-stone-900 dark:text-stone-100"
          >
            Slot
          </label>
          <EditableInput
            id="slot"
            value={focusedSlot}
            onChange={value => setCurrentSlot(value)}
            type="number"
          />
        </div>
        <div className="relative hidden lg:block">
          <label
            htmlFor="epoch"
            className="absolute -top-2 left-2 inline-block bg-stone-300 dark:bg-stone-500 rounded px-1 text-xs font-medium text-stone-900 dark:text-stone-100"
          >
            Epoch
          </label>
          <EditableInput
            id="epoch"
            value={focusedEpoch}
            onChange={value => setCurrentEpoch(value)}
            type="number"
          />
        </div>
        <div className="relative">
          <label
            htmlFor="time"
            className="absolute -top-2 left-2 bg-stone-300 dark:bg-stone-500 rounded px-1 text-xs font-medium text-stone-900 dark:text-stone-100 hidden sm:inline-block"
          >
            Time
          </label>
          <div className="w-72">
            <EditableInput
              id="time"
              value={Math.ceil(focusedTime / 1000) * 1000}
              onChange={value => setFocusedTime(value)}
              type="datetime-local"
            />
          </div>
        </div>
        <div className="flex items-center justify-self-center">
          <button
            type="button"
            className="p-2 group relative hidden xl:flex flex-shrink-0 items-center justify-center h-12 w-12 text-stone-900 dark:text-stone-100"
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowUturnLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="p-2 group relative flex flex-shrink-0 items-center justify-center rounded-full bg-stone-700 dark:bg-stone-200 hover:bg-stone-900 dark:hover:bg-stone-100 focus:outline-none focus:ring-stone-700 dark:focus:ring-stone-300 h-18 w-18 focus:ring focus:ring-offset-1"
            onClick={() => {
              if (playing) stopTimer();
              else playTimer();
            }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <PauseIcon className="fill-stone-100 dark:fill-stone-900 group-active:fill-stone-100/80 dark:group-active:fill-stone-900/80 h-4 w-4 xl:h-7 xl:w-7" />
            ) : (
              <PlayIcon className="fill-stone-100 dark:fill-stone-900 group-active:fill-stone-100/80 dark:group-active:fill-stone-900/80 h-4 w-4 xl:h-7 xl:w-7 pl-1" />
            )}
          </button>
          <button
            type="button"
            className="p-2 group relative hidden xl:flex flex-shrink-0 items-center justify-center h-12 w-12 text-stone-900 dark:text-stone-100"
            onClick={handleForward}
            aria-label="Back"
          >
            <ArrowUturnRightIcon className="h-6 w-6" />
          </button>
          <span className="relative inline-flex ml-4 xl:ml-0 text-stone-900 dark:text-stone-100">
            <button onClick={handleLive} disabled={playing && isCloseToLiveSlot}>
              Live
            </button>
            <span
              onClick={handleLive}
              className={`relative flex h-3 w-3 self-center ml-2 ${
                playing && isCloseToLiveSlot ? '' : 'cursor-pointer'
              }`}
            >
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  playing && isCloseToLiveSlot
                    ? 'bg-rose-400 dark:bg-rose-600'
                    : 'bg-stone-400 dark:bg-stone-100'
                } opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  playing && isCloseToLiveSlot ? 'bg-rose-500' : 'bg-stone-500 dark:bg-stone-200'
                }`}
              ></span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(TimelineControl);
