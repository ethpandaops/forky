export interface SlotSchedule {
  genesisTime: number;
  slotDurationMs: number;
  slotsPerEpoch: number;
  hezeForkEpoch?: number;
  hezeSlotDurationMs?: number;
}

function hezeForkSlot({ slotsPerEpoch, hezeForkEpoch, hezeSlotDurationMs }: SlotSchedule) {
  if (!hezeSlotDurationMs || hezeForkEpoch === undefined) return Infinity;
  return hezeForkEpoch * slotsPerEpoch;
}

export function slotDuration(schedule: SlotSchedule, slot: number): number {
  if (slot >= hezeForkSlot(schedule) && schedule.hezeSlotDurationMs) {
    return schedule.hezeSlotDurationMs;
  }
  return schedule.slotDurationMs;
}

export function slotStartTime(schedule: SlotSchedule, slot: number): number {
  const { genesisTime, slotDurationMs, hezeSlotDurationMs } = schedule;
  const forkSlot = hezeForkSlot(schedule);
  if (slot < forkSlot || !hezeSlotDurationMs) {
    return genesisTime + slot * slotDurationMs;
  }
  return genesisTime + forkSlot * slotDurationMs + (slot - forkSlot) * hezeSlotDurationMs;
}

export function slotAtTime(schedule: SlotSchedule, time: number): number {
  const { genesisTime, slotDurationMs, hezeSlotDurationMs } = schedule;
  const forkSlot = hezeForkSlot(schedule);
  const forkTime = slotStartTime(schedule, forkSlot);
  if (time < forkTime || !hezeSlotDurationMs) {
    return Math.floor((time - genesisTime) / slotDurationMs);
  }
  return forkSlot + Math.floor((time - forkTime) / hezeSlotDurationMs);
}
