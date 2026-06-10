import { useCallback, useState, useMemo } from 'react';

import {
  Dialog,
  DialogBackdrop,
  RadioGroup,
  Listbox,
  DialogPanel,
  DialogTitle,
  Label,
  Radio,
  ListboxOptions,
  ListboxOption,
  ListboxButton,
} from '@headlessui/react';
import { ArrowTopRightOnSquareIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'clsx';
import ReactTimeAgo from 'react-time-ago';
import Link from '@components/Link';
import { useAppNavigate } from '@hooks/useAppNavigation';

import EditableInput from '@components/EditableInput';
import Loading from '@components/Loading';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import { useMetadataQuery } from '@hooks/useQuery';

const colorMap: Record<string, string> = {
  Reorg: 'text-danger',
};

const lableMap: Record<string, string> = {
  consensus_client_implementation: 'Client',
  consensus_client_version: 'Client Version',
  fetch_request_duration_ms: 'Request Duration (ms)',
  xatu_reorg_event_slot: 'Reorg Slot',
  xatu_reorg_event_epoch: 'Reorg Epoch',
  xatu_reorg_event_old_head_block: 'Old Head Block',
  xatu_reorg_event_old_head_state: 'Old Head State',
  xatu_reorg_event_new_head_block: 'New Head Block',
  xatu_reorg_event_new_head_state: 'New Head State',
  xatu_reorg_event_depth: 'Reorg Depth',
};

const formatExtraDataFromLabels = (labels?: string[] | null): [string, string, string][] => {
  const extraData: [string, string, string][] = [];
  if (!labels) return extraData;
  for (const label of labels) {
    const [key, value] = label.split('=', 2);
    if (
      [
        'xatu_sentry',
        'ethereum_network_id',
        'ethereum_network_name',
        'xatu_reorg_frame_timing',
        'xatu_event_id',
      ].includes(key)
    )
      continue;
    let color = '';

    // hanlde special case
    if (key === 'xatu_reorg_event_depth') {
      const depth = Number.parseInt(value);
      if (depth > 2) color = 'text-danger';
      else color = 'text-caution';
    }

    extraData.push([lableMap[key] ?? key, value, color]);
  }
  return extraData;
};

const queryOptions = [{ name: 'Relative' }, { name: 'Slot' }, { name: 'Epoch' }];
const queryRelativeOptions = [
  { id: 1000 * 60 * 60, name: 'Last 1 hour' },
  { id: 1000 * 60 * 60 * 3, name: 'Last 3 hours' },
  { id: 1000 * 60 * 60 * 12, name: 'Last 12 hours' },
  { id: 1000 * 60 * 60 * 24, name: 'Last 24 hours' },
  { id: 1000 * 60 * 60 * 3, name: 'Last 3 days' },
  { id: 1000 * 60 * 60 * 7, name: 'Last 7 days' },
];

export default function Events({ open, closeTo }: { open: boolean; closeTo: string }) {
  const [queryType, setQueryType] = useState(queryOptions[0]);
  const [queryRelative, setQueryRelative] = useState(queryRelativeOptions[3]);
  const [querySlot, setQuerySlot] = useState<string>('');
  const [queryEpoch, setQueryEpoch] = useState<string>('');
  const [queryFilter, setQueryFilter] = useState<{ after?: string; slot?: number; epoch?: number }>(
    () => ({
      after: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    }),
  );
  const { node, stop, setTime } = useFocus();
  const { slotsPerEpoch, secondsPerSlot, genesisTime } = useEthereum();
  const setLocation = useAppNavigate();

  // Recompute the filter at event time (in the input handlers below) rather
  // than reacting to state changes in an effect.
  const updateQueryFilter = useCallback(
    (
      type: (typeof queryOptions)[number],
      relative: (typeof queryRelativeOptions)[number],
      slot: string,
      epoch: string,
    ) => {
      if (type.name === 'Relative') {
        setQueryFilter({ after: new Date(Date.now() - relative.id).toISOString() });
      } else if (type.name === 'Slot') {
        if (!slot) return;
        const val = Number.parseInt(slot);
        if (isNaN(val)) return;
        if (val < 0) return;
        setQueryFilter({ slot: val });
      } else if (type.name === 'Epoch') {
        if (!epoch) return;
        const val = Number.parseInt(epoch);
        if (isNaN(val)) return;
        if (val < 0) return;
        setQueryFilter({ epoch: val });
      }
    },
    [],
  );

  const { data, isLoading, error } = useMetadataQuery(
    {
      ...queryFilter,
      node,
      event_source: 'xatu_reorg_event',
    },
    open,
  );

  const events = useMemo<
    {
      snapshots: { id: string; key?: string }[];
      extraData: [string, string, string][];
      time: number;
      type: string;
      node: string;
      id: string;
    }[]
  >(() => {
    if (!open || !data) return [];
    const groupedEvents = data.reduce<
      Record<
        string,
        {
          snapshots: { id: string; key?: string }[];
          extraData: [string, string, string][];
          time: number;
          type: string;
          node: string;
          id: string;
        }
      >
    >((acc, event) => {
      const sharedEventId = event.labels?.find(label => label.startsWith('xatu_event_id='));
      const time = new Date(event.fetched_at).getTime();
      if (event.event_source === 'xatu_reorg_event' && sharedEventId) {
        const isBefore = event.labels?.includes('xatu_reorg_frame_timing=before');
        if (!acc[sharedEventId]) {
          acc[sharedEventId] = {
            id: sharedEventId,
            node: event.node,
            snapshots: [{ id: event.id, key: isBefore ? 'before' : 'after' }],
            extraData: formatExtraDataFromLabels(event.labels),
            time,
            type: event.event_source ?? 'Unknown',
          };
        } else {
          acc[sharedEventId].snapshots.push({ id: event.id, key: isBefore ? 'before' : 'after' });
          if (!isBefore) acc[sharedEventId].time = time;
          acc[sharedEventId].snapshots.sort((a, b) => {
            if (a.key === 'before') return -1;
            if (b.key === 'before') return 1;
            return 0;
          });
        }
      } else {
        acc[event.id] = {
          id: event.id,
          node: event.node,
          snapshots: [{ id: event.id }],
          extraData: formatExtraDataFromLabels(event.labels),
          time: new Date(event.fetched_at).getTime(),
          type: event.event_source ?? 'Unknown',
        };
      }

      return acc;
    }, {});

    return Object.values(groupedEvents).sort((a, b) => {
      if (a.time === b.time) {
        if (a.node.localeCompare(b.node) === 0) {
          return a.id.localeCompare(b.id);
        }
        return a.node.localeCompare(b.node);
      }
      return b.time - a.time;
    });
  }, [open, data]);

  return (
    <div className="bg-shell">
      <header className="absolute inset-x-0 top-0 z-20">
        <Dialog open={open} onClose={() => setLocation(closeTo)}>
          <DialogBackdrop
            transition
            className="fixed inset-0 z-30 bg-scrim backdrop-blur-xs transition-opacity duration-150 ease-out data-[closed]:opacity-0"
          />
          <div className="fixed inset-0 overflow-hidden z-30">
            <div className="absolute inset-0 overflow-hidden">
              <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <DialogPanel
                  transition
                  className="fixed inset-y-0 overflow-x-hidden right-0 w-full overflow-y-auto border-l border-border bg-background sm:max-w-[95%] transform transition ease-out duration-150 sm:duration-200 data-[closed]:translate-x-full"
                >
                  <div className="flex h-full flex-col py-6">
                    <div className="px-4 mb-6 mt-1 sm:px-6">
                      <div className="flex items-start justify-between">
                        <DialogTitle className="mt-1 flex items-center gap-2 text-base/6 text-foreground">
                          <span className="font-mono text-xs font-semibold uppercase tracking-widest">
                            Events
                          </span>
                          {node && (
                            <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px]/4 text-muted">
                              {node}
                              <Link href="/events">
                                <XMarkIcon className="inline size-3.5 cursor-pointer align-text-top transition-colors duration-150 hover:text-active" />
                              </Link>
                            </span>
                          )}
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-faint transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground"
                            onClick={() => setLocation(closeTo)}
                          >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="size-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 border-y border-border bg-surface px-4 py-3">
                      <RadioGroup
                        value={queryType}
                        onChange={value => {
                          setQueryType(value);
                          updateQueryFilter(value, queryRelative, querySlot, queryEpoch);
                        }}
                      >
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                          {queryOptions.map(option => (
                            <Radio
                              key={option.name}
                              value={option}
                              className={({ focus, checked }) =>
                                classNames(
                                  'cursor-pointer focus:outline-hidden transition-colors duration-150',
                                  focus
                                    ? 'ring-2 ring-active ring-offset-2 ring-offset-surface'
                                    : '',
                                  checked
                                    ? 'bg-active text-foreground-inverted hover:bg-active-hover'
                                    : 'ring-1 ring-inset ring-border-strong bg-surface-raised text-muted hover:bg-surface-hover hover:text-foreground',
                                  'flex items-center justify-center rounded-lg py-2.5 px-3 font-mono text-xs font-semibold uppercase tracking-wider sm:flex-1',
                                )
                              }
                            >
                              <Label as="span">{option.name}</Label>
                            </Radio>
                          ))}
                        </div>
                      </RadioGroup>
                      {queryType.name === 'Relative' && (
                        <Listbox
                          as="div"
                          value={queryRelative}
                          onChange={value => {
                            setQueryRelative(value);
                            updateQueryFilter(queryType, value, querySlot, queryEpoch);
                          }}
                        >
                          {() => (
                            <>
                              <div className="relative mt-4">
                                <ListboxButton className="relative w-full cursor-default rounded-lg border border-border-strong bg-field py-1.5 pl-2.5 pr-10 text-left text-sm/6 text-foreground transition-colors duration-150 focus:border-accent focus:outline-hidden">
                                  <span className="block truncate">{queryRelative.name}</span>
                                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                      className="size-5 text-faint"
                                      aria-hidden="true"
                                    />
                                  </span>
                                </ListboxButton>

                                <ListboxOptions
                                  transition
                                  className="transition ease-in duration-100 data-[closed]:opacity-0 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface-raised py-1 text-sm shadow-lg focus:outline-hidden"
                                >
                                  {queryRelativeOptions.map(option => (
                                    <ListboxOption
                                      key={option.id}
                                      className={({ focus }) =>
                                        classNames(
                                          focus
                                            ? 'bg-active text-foreground-inverted'
                                            : 'text-foreground',
                                          'relative cursor-default select-none py-2 pl-8 pr-4',
                                        )
                                      }
                                      value={option}
                                    >
                                      {({ selected, focus }) => (
                                        <>
                                          <span
                                            className={classNames(
                                              selected ? 'font-semibold' : 'font-normal',
                                              'block truncate',
                                            )}
                                          >
                                            {option.name}
                                          </span>

                                          {selected ? (
                                            <span
                                              className={classNames(
                                                focus ? 'text-foreground-inverted' : 'text-active',
                                                'absolute inset-y-0 left-0 flex items-center pl-1.5',
                                              )}
                                            >
                                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </ListboxOption>
                                  ))}
                                </ListboxOptions>
                              </div>
                            </>
                          )}
                        </Listbox>
                      )}

                      {queryType.name === 'Slot' && (
                        <div className="relative mt-4">
                          <EditableInput
                            id="time"
                            value={querySlot}
                            onChange={value => {
                              setQuerySlot(value);
                              updateQueryFilter(queryType, queryRelative, value, queryEpoch);
                            }}
                            type="text"
                          />
                        </div>
                      )}

                      {queryType.name === 'Epoch' && (
                        <div className="relative mt-4">
                          <EditableInput
                            id="time"
                            value={queryEpoch}
                            onChange={value => {
                              setQueryEpoch(value);
                              updateQueryFilter(queryType, queryRelative, querySlot, value);
                            }}
                            type="text"
                          />
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto border-y border-border bg-surface">
                      <div className="px-4">
                        <table className="min-w-full divide-y divide-border-strong">
                          <thead>
                            <tr>
                              <th
                                scope="col"
                                className="py-2.5 pl-4 pr-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-faint sm:pl-0"
                              >
                                Date
                              </th>
                              <th
                                scope="col"
                                className="py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
                              >
                                Type
                              </th>
                              <th
                                scope="col"
                                className="py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
                              >
                                Node
                              </th>
                              <th
                                scope="col"
                                className="py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
                              >
                                Snapshot ID
                              </th>
                              <th
                                scope="col"
                                className="py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
                              >
                                Slot
                              </th>
                              <th
                                scope="col"
                                className="py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
                              >
                                Epoch
                              </th>
                              <th
                                scope="col"
                                className="py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
                              >
                                Extra Data
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {events.map(event => {
                              if (!event) return null;
                              const time = new Date(event.time);
                              const timeDiff = (time.getTime() - genesisTime) / 1000;
                              const slot = Math.floor(timeDiff / secondsPerSlot);
                              const epoch = Math.floor(slot / slotsPerEpoch);
                              return (
                                <tr
                                  key={event.id}
                                  className="transition-colors duration-150 hover:bg-overlay/3"
                                >
                                  <td className="whitespace-nowrap py-2.5 pl-4 pr-3 text-sm text-foreground sm:pl-0">
                                    <ReactTimeAgo date={time} />
                                    <span className="pl-1.5 font-mono text-xs text-muted">
                                      {time.toISOString()}
                                    </span>
                                  </td>
                                  <td
                                    className={classNames(
                                      'whitespace-nowrap py-2.5 pl-4 pr-3 font-mono text-xs font-semibold uppercase tracking-wider sm:pl-0',
                                      colorMap[event.type] ?? 'text-foreground',
                                    )}
                                  >
                                    {event.type}
                                  </td>
                                  <td className="whitespace-nowrap py-2.5 pl-4 pr-3 text-sm font-medium sm:pl-0">
                                    <Link
                                      href={`/node/${event.node}`}
                                      className="text-link transition-colors duration-150 hover:text-link-hover hover:underline"
                                      onClick={() => {
                                        stop();
                                        setTime(time.getTime() + 100);
                                      }}
                                    >
                                      {event.node}
                                      <ArrowTopRightOnSquareIcon className="ml-1 inline size-3.5 align-[-2px]" />
                                    </Link>
                                  </td>
                                  <td className="py-2.5 pl-4 pr-3 font-mono text-xs sm:pl-0">
                                    {event.snapshots.map(({ id, key }) => (
                                      <div key={id} className="whitespace-nowrap">
                                        {key && <span className="pr-1 text-muted">{key}:</span>}
                                        <Link
                                          href={`/snapshot/${id}`}
                                          className="text-link transition-colors duration-150 hover:text-link-hover hover:underline"
                                          onClick={() => {
                                            stop();
                                            setTime(time.getTime() + 100);
                                          }}
                                        >
                                          {id}
                                          <ArrowTopRightOnSquareIcon className="ml-1 inline size-3.5 align-[-2px]" />
                                        </Link>
                                      </div>
                                    ))}
                                  </td>
                                  <td className="whitespace-nowrap py-2.5 pl-4 pr-3 font-mono text-xs tabular-nums text-foreground sm:pl-0">
                                    {slot}
                                  </td>
                                  <td className="whitespace-nowrap py-2.5 pl-4 pr-3 font-mono text-xs tabular-nums text-foreground sm:pl-0">
                                    {epoch}
                                  </td>
                                  <td className="whitespace-nowrap py-2.5 pl-4 pr-3 text-xs text-foreground sm:pl-0">
                                    {event.extraData.map(([key, value, color]) => {
                                      return (
                                        <div key={key} className={color}>
                                          <span className="text-muted">{key}:</span> {value}
                                        </div>
                                      );
                                    })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {(isLoading || Boolean(error)) && (
                          <Loading message={`${error ?? 'Loading...'}`} className="p-10" />
                        )}
                        {events.length === 0 && !isLoading && !error && (
                          <div className="p-10 text-center font-mono text-xs uppercase tracking-widest text-muted">
                            No events found
                          </div>
                        )}
                      </div>
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
