import { memo, useRef } from 'react';

import {
  ArrowUturnRightIcon,
  ArrowUturnLeftIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/20/solid';
import classNames from 'clsx';

import EditableInput from '@components/EditableInput';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import useNow from '@hooks/useNow';
import useOutsideInteraction from '@hooks/useOutsideInteraction';

const FIELD =
  'flex items-center gap-2 rounded-lg border border-border-strong bg-field px-2.5 transition-colors duration-150 focus-within:border-accent';
const FIELD_LABEL = 'font-mono text-[9px]/3 uppercase tracking-widest text-faint';
const FIELD_INPUT =
  'block w-full bg-transparent py-1.5 font-mono text-xs/5 tabular-nums text-foreground focus:outline-hidden';
const STEP_BUTTON =
  'hidden size-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:flex';

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
  const now = useNow();

  const slotDiff = Math.floor((now - genesisTime) / 1000 / secondsPerSlot) - focusedSlot;
  const isCloseToLiveSlot = slotDiff <= 3 && slotDiff >= -1;
  const isLive = playing && isCloseToLiveSlot;

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
    <div ref={controlRef} className="flex justify-center px-2">
      <div className="glass-chrome mb-2 flex w-full max-w-full items-center justify-center gap-2 rounded-xl border border-border px-2.5 py-2 shadow-lg sm:w-fit sm:gap-3 sm:px-3">
        <label className={classNames(FIELD, 'min-w-0 flex-1 sm:flex-none')}>
          <span className={FIELD_LABEL}>Slot</span>
          <EditableInput
            id="slot"
            value={focusedSlot}
            onChange={value => setCurrentSlot(value)}
            type="number"
            className={classNames(FIELD_INPUT, 'sm:w-24')}
          />
        </label>
        <label className={classNames(FIELD, 'hidden lg:flex')}>
          <span className={FIELD_LABEL}>Epoch</span>
          <EditableInput
            id="epoch"
            value={focusedEpoch}
            onChange={value => setCurrentEpoch(value)}
            type="number"
            className={classNames(FIELD_INPUT, 'w-20')}
          />
        </label>
        <label className={classNames(FIELD, 'hidden md:flex')}>
          <span className={FIELD_LABEL}>Time</span>
          <EditableInput
            id="time"
            value={Math.ceil(focusedTime / 1000) * 1000}
            onChange={value => setFocusedTime(value)}
            type="datetime-local"
            className={classNames(FIELD_INPUT, 'w-44')}
          />
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className={STEP_BUTTON} onClick={handleBack} aria-label="Back">
            <ArrowUturnLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            className="group flex size-10 shrink-0 items-center justify-center rounded-full bg-control transition-colors duration-150 hover:bg-control-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:size-11"
            onClick={() => {
              if (playing) stopTimer();
              else playTimer();
            }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <PauseIcon className="size-5 fill-on-primary group-active:fill-on-primary/80" />
            ) : (
              <PlayIcon className="size-5 fill-on-primary pl-0.5 group-active:fill-on-primary/80" />
            )}
          </button>
          <button
            type="button"
            className={STEP_BUTTON}
            onClick={handleForward}
            aria-label="Forward"
          >
            <ArrowUturnRightIcon className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleLive}
          disabled={isLive}
          className={classNames(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[10px]/4 font-semibold uppercase tracking-widest transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            isLive
              ? 'border-rec/40 text-rec-strong'
              : 'cursor-pointer border-border-strong text-muted hover:border-border-strong hover:text-foreground',
          )}
        >
          Live
          <span className="relative flex size-2" aria-hidden="true">
            <span
              className={classNames(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                isLive ? 'bg-rec' : 'bg-scrubber',
              )}
            ></span>
            <span
              className={classNames(
                'relative inline-flex size-2 rounded-full',
                isLive ? 'bg-rec-strong' : 'bg-scrubber-strong',
              )}
            ></span>
          </span>
        </button>
      </div>
    </div>
  );
}

export default memo(TimelineControl);
