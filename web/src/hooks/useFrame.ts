import useFrames from '@contexts/frames';
import { Data } from '@hooks/useFrames';

export default function useFrame(id: string): Data | undefined {
  const { frames } = useFrames();
  return frames[id];
}
