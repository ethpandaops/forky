import { slotAtTime, slotDuration, slotStartTime } from '@utils/slots';

const genesisTime = 1_000_000;
const schedule = {
  genesisTime,
  slotDurationMs: 12_000,
  slotsPerEpoch: 32,
  hezeForkEpoch: 5,
  hezeSlotDurationMs: 9_000,
};

describe('slots', () => {
  it('uses the base slot duration without a Heze schedule', () => {
    const base = { genesisTime, slotDurationMs: 12_000, slotsPerEpoch: 32 };
    expect(slotDuration(base, 1000)).toBe(12_000);
    expect(slotStartTime(base, 1000)).toBe(genesisTime + 1000 * 12_000);
    expect(slotAtTime(base, genesisTime + 1000 * 12_000 + 11_999)).toBe(1000);
  });

  it('switches to the Heze slot duration at the fork epoch', () => {
    expect(slotDuration(schedule, 159)).toBe(12_000);
    expect(slotDuration(schedule, 160)).toBe(9_000);
    expect(slotStartTime(schedule, 160)).toBe(genesisTime + 160 * 12_000);
    expect(slotStartTime(schedule, 161)).toBe(genesisTime + 160 * 12_000 + 9_000);
    expect(slotAtTime(schedule, genesisTime + 160 * 12_000 - 1)).toBe(159);
    expect(slotAtTime(schedule, genesisTime + 160 * 12_000)).toBe(160);
    expect(slotAtTime(schedule, genesisTime + 160 * 12_000 + 18_799 * 9_000)).toBe(18_959);
  });

  it('round-trips slot start times across the fork', () => {
    for (const slot of [0, 1, 159, 160, 161, 18_959]) {
      expect(slotAtTime(schedule, slotStartTime(schedule, slot))).toBe(slot);
    }
  });
});
