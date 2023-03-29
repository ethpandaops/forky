import useFrameMeta from '@contexts/frameMeta';
import { Data } from '@hooks/useFrameMeta';

export default function useSlotMeta(slotNumber: number): Data | undefined {
  const { slots } = useFrameMeta();
  return slots[slotNumber];
}
