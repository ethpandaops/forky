/**
 * App-specific API view types. The wire types live in the generated client
 * (`@api`) — only types that intentionally differ from the spec belong here.
 */

/** Frame filter with the event sources the UI knows how to present. */
export interface FrameFilter {
  node?: string;
  before?: string;
  after?: string;
  slot?: number;
  epoch?: number;
  labels?: string[];
  consensus_client?: string;
  event_source?: 'unknown' | 'beacon_node' | 'xatu_polling' | 'xatu_reorg_event';
}
