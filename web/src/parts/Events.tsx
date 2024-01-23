import { Fragment, useEffect, useRef, useState, useMemo } from 'react';

import { Dialog, Transition, RadioGroup, Listbox } from '@headlessui/react';
import { ArrowTopRightOnSquareIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import ReactTimeAgo from 'react-time-ago';
import { useLocation, Link } from 'wouter';

import EditableInput from '@components/EditableInput';
import Loading from '@components/Loading';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import { useMetadataQuery } from '@hooks/useQuery';

const eventMap: Record<string, string> = {
  BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG: 'Reorg',
  BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG_V2: 'Reorg',
};

const colorMap: Record<string, string> = {
  Reorg: 'text-red-600 dark:text-red-400',
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
      if (depth > 2) color = 'text-red-600 dark:text-red-400';
      else color = 'text-yellow-600 dark:text-yellow-400';
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

export default function Selection() {
  const [queryType, setQueryType] = useState(queryOptions[0]);
  const [queryRelative, setQueryRelative] = useState(queryRelativeOptions[3]);
  const [querySlot, setQuerySlot] = useState<string>('');
  const [queryEpoch, setQueryEpoch] = useState<string>('');
  const [queryFilter, setQueryFilter] = useState<{ after?: string; slot?: number; epoch?: number }>(
    {
      after: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  );
  const { node, stop, setTime } = useFocus();
  const { slotsPerEpoch, secondsPerSlot, genesisTime } = useEthereum();
  const [location, setLocation] = useLocation();
  const isEventRoute = location.endsWith('/events');
  const previousLocation = useRef(isEventRoute ? '/' : location);
  useEffect(() => {
    if (!isEventRoute) previousLocation.current = location;
  }, [location]);

  useEffect(() => {
    if (queryType.name === 'Relative') {
      setQueryFilter({ after: new Date(Date.now() - queryRelative.id).toISOString() });
    } else if (queryType.name === 'Slot') {
      if (!querySlot) return;
      const val = Number.parseInt(querySlot);
      if (isNaN(val)) return;
      if (val < 0) return;
      setQueryFilter({ slot: val });
    } else if (queryType.name === 'Epoch') {
      if (!queryEpoch) return;
      const val = Number.parseInt(queryEpoch);
      if (isNaN(val)) return;
      if (val < 0) return;
      setQueryFilter({ epoch: Number.parseInt(queryEpoch) });
    }
  }, [queryType, queryRelative, querySlot, queryEpoch]);

  const { data, isLoading, error } = useMetadataQuery(
    {
      ...queryFilter,
      node,
      event_source: 'xatu_reorg_event',
    },
    isEventRoute,
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
    if (!isEventRoute || !data) return [];
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
      const sharedEventId = event.labels?.find((label) => label.startsWith('xatu_event_id='));
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
  }, [isEventRoute, data?.length]);

  return (
    <div className="bg-stone-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <Transition.Root show={isEventRoute} as={Fragment}>
          <Dialog as="div" onClose={() => setLocation(previousLocation.current)}>
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-stone-500 bg-opacity-75 transition-opacity z-30" />
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
                    <Dialog.Panel className="fixed inset-y-0 overflow-x-hidden right-0 w-full overflow-y-auto bg-stone-100 dark:bg-stone-900 sm:ring-1 sm:ring-white/10 sm:max-w-[95%]">
                      <div className="flex h-full flex-col py-6 shadow-xl">
                        <div className="px-4 mb-6 mt-1 sm:px-6">
                          <div className="flex items-start justify-between">
                            <Dialog.Title className="mt-1 flex items-center text-base  leading-6 text-stone-900 dark:text-stone-100">
                              <span className="font-semibold">Events</span>
                              {node && (
                                <span>
                                  : {node}
                                  <Link
                                    href="/events"
                                    onClick={() => {
                                      previousLocation.current = '/';
                                    }}
                                  >
                                    <XMarkIcon className="inline w-4 h-4 hover:text-stone-600 dark:hover:text-stone-400 cursor-pointer align-top" />
                                  </Link>
                                </span>
                              )}
                            </Dialog.Title>
                            <div className="ml-3 flex h-7 items-center">
                              <button
                                type="button"
                                className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-900/5 dark:hover:bg-white/5"
                                onClick={() => setLocation(previousLocation.current)}
                              >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon className="h-7 w-7" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-800 shadow dark:shadow-inner mb-2 px-4 py-2">
                          <RadioGroup value={queryType} onChange={setQueryType}>
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                              {queryOptions.map((option) => (
                                <RadioGroup.Option
                                  key={option.name}
                                  value={option}
                                  className={({ active, checked }) =>
                                    classNames(
                                      'cursor-pointer focus:outline-none',
                                      active
                                        ? 'ring-2 ring-stone-600 dark:ring-stone-400 ring-offset-2'
                                        : '',
                                      checked
                                        ? 'bg-stone-600 dark:bg-stone-400 text-stone-100 dark:text-stone-900 hover:bg-stone-500'
                                        : 'ring-1 ring-inset ring-stone-300 dark:ring-stone-700 bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-950',
                                      'flex items-center justify-center rounded-md py-3 px-3 text-sm font-semibold uppercase sm:flex-1',
                                    )
                                  }
                                >
                                  <RadioGroup.Label as="span">{option.name}</RadioGroup.Label>
                                </RadioGroup.Option>
                              ))}
                            </div>
                          </RadioGroup>
                          {queryType.name === 'Relative' && (
                            <Listbox value={queryRelative} onChange={setQueryRelative}>
                              {({ open }) => (
                                <>
                                  <div className="relative mt-4">
                                    <Listbox.Button className="relative w-full cursor-default rounded-md bg-stone-100 dark:bg-stone-600 py-1 pl-2 pr-10 text-left text-stone-900 dark:text-stone-100 shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-600 dark:focus:ring-stone-400 sm:text-sm sm:leading-6">
                                      <span className="block truncate">{queryRelative.name}</span>
                                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronUpDownIcon
                                          className="h-5 w-5 text-stone-400"
                                          aria-hidden="true"
                                        />
                                      </span>
                                    </Listbox.Button>

                                    <Transition
                                      show={open}
                                      as={Fragment}
                                      leave="transition ease-in duration-100"
                                      leaveFrom="opacity-100"
                                      leaveTo="opacity-0"
                                    >
                                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-stone-200 dark:bg-stone-800 py-1 text-base shadow-lg ring-1 ring-stone-900 dark:ring-stone-100 ring-opacity-5 focus:outline-none sm:text-sm">
                                        {queryRelativeOptions.map((option) => (
                                          <Listbox.Option
                                            key={option.id}
                                            className={({ active }) =>
                                              classNames(
                                                active
                                                  ? 'bg-stone-600 dark:bg-stone-400 text-stone-100 dark:text-stone-900'
                                                  : 'text-stone-900 dark:text-stone-100',
                                                'relative cursor-default select-none py-2 pl-8 pr-4',
                                              )
                                            }
                                            value={option}
                                          >
                                            {({ selected, active }) => (
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
                                                      active
                                                        ? 'text-stone-100 dark:text-stone-900'
                                                        : 'text-stone-600 dark:text-stone-400',
                                                      'absolute inset-y-0 left-0 flex items-center pl-1.5',
                                                    )}
                                                  >
                                                    <CheckIcon
                                                      className="h-5 w-5"
                                                      aria-hidden="true"
                                                    />
                                                  </span>
                                                ) : null}
                                              </>
                                            )}
                                          </Listbox.Option>
                                        ))}
                                      </Listbox.Options>
                                    </Transition>
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
                                onChange={(value) => setQuerySlot(value)}
                                type="text"
                              />
                            </div>
                          )}

                          {queryType.name === 'Epoch' && (
                            <div className="relative mt-4">
                              <EditableInput
                                id="time"
                                value={queryEpoch}
                                onChange={(value) => setQueryEpoch(value)}
                                type="text"
                              />
                            </div>
                          )}
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-800 shadow dark:shadow-inner overflow-x-auto">
                          <div className="border-t border-stone-200 dark:border-b dark:border-stone-800 px-4">
                            <table className="min-w-full divide-y divide-stone-700">
                              <thead>
                                <tr>
                                  <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 sm:pl-0"
                                  >
                                    Date
                                  </th>
                                  <th
                                    scope="col"
                                    className="py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100"
                                  >
                                    Type
                                  </th>
                                  <th
                                    scope="col"
                                    className="py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100"
                                  >
                                    Node
                                  </th>
                                  <th
                                    scope="col"
                                    className="py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100"
                                  >
                                    Snapshot ID
                                  </th>
                                  <th
                                    scope="col"
                                    className="py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100"
                                  >
                                    Slot
                                  </th>
                                  <th
                                    scope="col"
                                    className="py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100"
                                  >
                                    Epoch
                                  </th>
                                  <th
                                    scope="col"
                                    className="py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100"
                                  >
                                    Extra Data
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-800">
                                {events.map((event) => {
                                  if (!event) return null;
                                  const time = new Date(event.time);
                                  const timeDiff = (time.getTime() - genesisTime) / 1000;
                                  const slot = Math.floor(timeDiff / secondsPerSlot);
                                  const epoch = Math.floor(slot / slotsPerEpoch);
                                  return (
                                    <tr key={event.id}>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-stone-900 dark:text-stone-100 sm:pl-0">
                                        <ReactTimeAgo date={time} />
                                        <span className="pl-1">({time.toISOString()})</span>
                                      </td>
                                      <td
                                        className={classNames(
                                          'whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold sm:pl-0 uppercase',
                                          colorMap[event.type] ??
                                            'text-stone-900 dark:text-stone-100',
                                        )}
                                      >
                                        {event.type}
                                      </td>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold underline text-stone-900 dark:text-stone-100 sm:pl-0">
                                        <Link
                                          href={`/node/${event.node}`}
                                          onClick={() => {
                                            stop();
                                            setTime(time.getTime() + 100);
                                          }}
                                        >
                                          {event.node}
                                        </Link>
                                        <ArrowTopRightOnSquareIcon className="inline h-5 w-5 pl-1" />
                                      </td>
                                      <td className="py-4 pl-4 pr-3 text-sm font-semibold text-stone-900 dark:text-stone-100 sm:pl-0">
                                        {event.snapshots.map(({ id, key }) => (
                                          <div key={id} className="whitespace-nowrap">
                                            {key && (
                                              <span className="font-normal pr-1">{key}:</span>
                                            )}
                                            <Link
                                              href={`/snapshot/${id}`}
                                              className="underline"
                                              onClick={() => {
                                                stop();
                                                setTime(time.getTime() + 100);
                                              }}
                                            >
                                              {id}
                                            </Link>
                                            <ArrowTopRightOnSquareIcon className="inline h-5 w-5 pl-1" />
                                          </div>
                                        ))}
                                      </td>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-stone-900 dark:text-stone-100 sm:pl-0">
                                        {slot}
                                      </td>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-stone-900 dark:text-stone-100 sm:pl-0">
                                        {epoch}
                                      </td>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-stone-900 dark:text-stone-100 sm:pl-0">
                                        {event.extraData.map(([key, value, color]) => {
                                          return (
                                            <div key={key} className={color}>
                                              {key}: {value}
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
                              <div className="p-10 text-center text-stone-900 dark:text-stone-100 font-bold">
                                No events found
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
