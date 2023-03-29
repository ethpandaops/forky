import React, { useState, useEffect, useCallback } from 'react';

import {
  ArrowUturnRightIcon,
  ArrowUturnLeftIcon,
  PauseIcon,
  PlayIcon,
  PlayCircleIcon,
} from '@heroicons/react/20/solid';

import EditableInput from '@components/EditableInput';
import useTimeline from '@contexts/timeline';

function TimelineControl() {
  const {
    focusedTime,
    setFocusedTime,
    setCurrentSlot,
    setCurrentEpoch,
    focusedSlot,
    focusedEpoch,
    genesisTime,
    playTimer,
    stopTimer,
    playing,
    focusedTimeIntoSlot,
    secondsPerSlot,
  } = useTimeline();

  const isCloseToLiveSlot =
    Math.abs(Math.floor((Date.now() - genesisTime) / 1000 / secondsPerSlot) - focusedSlot) <= 1;

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
      setCurrentSlot(Math.floor((Date.now() - genesisTime) / 1000 / secondsPerSlot), true);
    } else if (!playing) {
      playTimer();
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 bg-stone-200 pl-3 rounded-t-xl">
        <div className="flex items-center">
          <label
            htmlFor="slot"
            className="mt-2 mr-2 font-bold block text-md leading-6 text-gray-900"
          >
            Slot
          </label>
          <EditableInput
            id="slot"
            value={focusedSlot}
            onChange={(value) => setCurrentSlot(value)}
            type="number"
          />
        </div>
        <div className="flex items-center">
          <label
            htmlFor="epoch"
            className="mt-2 mr-2 font-bold block text-md leading-6 text-gray-900"
          >
            Epoch
          </label>
          <EditableInput
            id="epoch"
            value={focusedEpoch}
            onChange={(value) => setCurrentEpoch(value)}
            type="number"
          />
        </div>
        <div className="flex items-center">
          <label
            htmlFor="time"
            className="mt-2 mr-2 font-bold block text-md leading-6 text-gray-900"
          >
            Time
          </label>
          <EditableInput
            id="time"
            value={Math.ceil(focusedTime / 1000) * 1000}
            onChange={(value) => setFocusedTime(value)}
            type="datetime-local"
          />
        </div>
        <br />
        <div className="flex items-center gap-3 m-3">
          <button
            type="button"
            className="p-2 group relative flex flex-shrink-0 items-center justify-center h-12 w-12 "
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowUturnLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="p-2 group relative flex flex-shrink-0 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-900 focus:outline-none focus:ring-slate-700 h-18 w-18 focus:ring focus:ring-offset-4"
            onClick={() => {
              if (playing) stopTimer();
              else playTimer();
            }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <PauseIcon className="fill-white group-active:fill-white/80 h-7 w-7" />
            ) : (
              <PlayIcon className="fill-white group-active:fill-white/80 h-7 w-7 pl-1" />
            )}
          </button>
          <button
            type="button"
            className="p-2 group relative flex flex-shrink-0 items-center justify-center h-12 w-12 "
            onClick={handleForward}
            aria-label="Back"
          >
            <ArrowUturnRightIcon className="h-6 w-6" />
          </button>
          <span className="relative inline-flex">
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
                  playing && isCloseToLiveSlot ? 'bg-rose-400' : 'bg-slate-400'
                } opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  playing && isCloseToLiveSlot ? 'bg-rose-500' : 'bg-slate-500'
                }`}
              ></span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default TimelineControl;
