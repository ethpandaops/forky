import { useEffect, RefObject, useCallback } from 'react';

const useOutsideInteraction = (ref: RefObject<HTMLElement>, callback: () => void): void => {
  const handleInteractionOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    },
    [ref, callback],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleInteractionOutside);
    document.addEventListener('touchstart', handleInteractionOutside);

    return () => {
      document.removeEventListener('mousedown', handleInteractionOutside);
      document.removeEventListener('touchstart', handleInteractionOutside);
    };
  }, [handleInteractionOutside]);
};

export default useOutsideInteraction;
