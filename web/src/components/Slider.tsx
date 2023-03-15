import { useRef } from 'react';

import classNames from 'classnames';
import { mergeProps, useFocusRing, useSlider, useSliderThumb, VisuallyHidden } from 'react-aria';
import { useSliderState, SliderStateOptions } from 'react-stately';

function parseTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  seconds = seconds - hours * 3600 - minutes * 60;
  return [hours, minutes, seconds];
}

function formatTime(seconds: number[], totalSeconds = seconds) {
  const totalWithoutLeadingZeroes = totalSeconds.slice(totalSeconds.findIndex((x) => x !== 0));
  return seconds
    .slice(seconds.length - totalWithoutLeadingZeroes.length)
    .map((x) => x.toString().padStart(2, '0'))
    .join(':');
}

function Thumb({
  state,
  trackRef,
  focusProps,
  isFocusVisible,
  onChangeStart,
  index,
}: {
  state: ReturnType<typeof useSliderState>;
  trackRef: React.RefObject<HTMLDivElement>;
  focusProps: React.HTMLAttributes<HTMLElement>;
  isFocusVisible: boolean;
  onChangeStart?: () => void;
  index: number;
}) {
  const inputRef = useRef(null);
  const { thumbProps, inputProps } = useSliderThumb({ index, trackRef, inputRef }, state);

  return (
    <div
      className="absolute top-1/2 -translate-x-1/2"
      style={{
        left: `${state.getThumbPercent(index) * 100}%`,
      }}
    >
      <div
        {...thumbProps}
        onMouseDown={(...args) => {
          thumbProps.onMouseDown?.(...args);
          onChangeStart?.();
        }}
        onPointerDown={(...args) => {
          thumbProps.onPointerDown?.(...args);
          onChangeStart?.();
        }}
        className={classNames(
          'h-4 rounded-full',
          isFocusVisible || state.isThumbDragging(index)
            ? 'w-1.5 bg-slate-900'
            : 'w-1 bg-slate-700',
        )}
      >
        <VisuallyHidden>
          <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
        </VisuallyHidden>
      </div>
    </div>
  );
}

export function Slider(props: SliderStateOptions<number | number[]>) {
  const trackRef = useRef(null);
  const state = useSliderState(props);
  const { groupProps, trackProps, labelProps, outputProps } = useSlider(props, state, trackRef);
  const { focusProps, isFocusVisible } = useFocusRing();

  const currentTime = parseTime(state.getThumbValue(0));
  const totalTime = parseTime(state.getThumbMaxValue(0));

  return (
    <div
      {...groupProps}
      className="absolute inset-x-0 bottom-full flex flex-auto touch-none items-center gap-6 md:relative"
    >
      {props.label && (
        <label className="sr-only" {...labelProps}>
          {props.label}
        </label>
      )}
      <div
        {...trackProps}
        onMouseDown={(...args) => {
          trackProps.onMouseDown?.(...args);
          // props.onChangeStart?.();
        }}
        onPointerDown={(...args) => {
          trackProps.onPointerDown?.(...args);
          // props.onChangeStart?.();
        }}
        ref={trackRef}
        className="relative w-full bg-slate-200 md:rounded-full"
      >
        <div
          className={classNames(
            'h-2 md:rounded-r-md md:rounded-l-xl',
            isFocusVisible || state.isThumbDragging(0) ? 'bg-slate-900' : 'bg-slate-700',
          )}
          style={{
            width:
              state.getThumbValue(0) === 0
                ? 0
                : `calc(${state.getThumbPercent(0) * 100}% - ${
                    isFocusVisible || state.isThumbDragging(0) ? '0.3125rem' : '0.25rem'
                  })`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `30%`,
          }}
        >
          <div className="h-4 rounded-full bg-rose-400 bg-opacity-50 px-0.5"></div>
        </div>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `20%`,
          }}
        >
          <div className="h-4 rounded-full bg-blue-400 bg-opacity-50 px-0.5"></div>
        </div>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `25%`,
          }}
        >
          <div className="h-4 rounded-full bg-blue-400 bg-opacity-50 px-0.5"></div>
        </div>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `56%`,
          }}
        >
          <div className="h-4 rounded-full bg-blue-400 bg-opacity-50 px-0.5"></div>
        </div>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `65%`,
          }}
        >
          <div className="h-4 rounded-full bg-blue-400 bg-opacity-50 px-0.5"></div>
        </div>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `80%`,
          }}
        >
          <div className="h-4 rounded-full bg-rose-400 bg-opacity-50 px-0.5"></div>
        </div>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `82%`,
          }}
        >
          <div className="h-4 rounded-full bg-blue-400 bg-opacity-50 px-0.5"></div>
        </div>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `95%`,
          }}
        >
          <div className="h-4 rounded-full bg-blue-400 bg-opacity-50 px-0.5"></div>
        </div>
        <Thumb
          index={0}
          state={state}
          trackRef={trackRef}
          // onChangeStart={props.onChangeStart}
          focusProps={focusProps}
          isFocusVisible={isFocusVisible}
        />
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <output
          {...outputProps}
          aria-live="off"
          className={classNames(
            'hidden rounded-md px-1 py-0.5 font-mono text-sm leading-6 md:block',
            state.getThumbMaxValue(0) === 0 && 'opacity-0',
            isFocusVisible || state.isThumbDragging(0)
              ? 'bg-slate-200 text-slate-900'
              : 'text-slate-500',
          )}
        >
          {formatTime(currentTime, totalTime)}
        </output>
        <span className="text-sm leading-6 text-slate-300" aria-hidden="true">
          /
        </span>
        <span
          className={classNames(
            'hidden rounded-md px-1 py-0.5 font-mono text-sm leading-6 text-slate-500 md:block',
            state.getThumbMaxValue(0) === 0 && 'opacity-0',
          )}
        >
          {formatTime(totalTime)}
        </span>
      </div>
    </div>
  );
}

export default Slider;
