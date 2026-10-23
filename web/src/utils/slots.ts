export interface SlotSchedule {
  genesisTime: number;
  secondsPerSlot: number;
  slotsPerEpoch: number;
  hezeForkEpoch?: number;
  hezeSecondsPerSlot?: number;
}

function hezeForkSlot({ slotsPerEpoch, hezeForkEpoch, hezeSecondsPerSlot }: SlotSchedule) {
  if (!hezeSecondsPerSlot || hezeForkEpoch === undefined) return Infinity;
  return hezeForkEpoch * slotsPerEpoch;
}

export function slotDuration(schedule: SlotSchedule, slot: number): number {
  if (slot >= hezeForkSlot(schedule) && schedule.hezeSecondsPerSlot) {
    return schedule.hezeSecondsPerSlot;
  }
  return schedule.secondsPerSlot;
}

export function slotStartTime(schedule: SlotSchedule, slot: number): number {
  const { genesisTime, secondsPerSlot, hezeSecondsPerSlot } = schedule;
  const forkSlot = hezeForkSlot(schedule);
  if (slot < forkSlot || !hezeSecondsPerSlot) {
    return genesisTime + slot * secondsPerSlot * 1000;
  }
  return (
    genesisTime + forkSlot * secondsPerSlot * 1000 + (slot - forkSlot) * hezeSecondsPerSlot * 1000
  );
}

export function slotAtTime(schedule: SlotSchedule, time: number): number {
  const { genesisTime, secondsPerSlot, hezeSecondsPerSlot } = schedule;
  const forkSlot = hezeForkSlot(schedule);
  const forkTime = slotStartTime(schedule, forkSlot);
  if (time < forkTime || !hezeSecondsPerSlot) {
    return Math.floor((time - genesisTime) / 1000 / secondsPerSlot);
  }
  return forkSlot + Math.floor((time - forkTime) / 1000 / hezeSecondsPerSlot);
}
