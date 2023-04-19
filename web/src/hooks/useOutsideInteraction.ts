import { useEffect, RefObject } from 'react';

const useOutsideInteraction = (ref: RefObject<HTMLElement>, callback: () => void): void => {
  const handleInteractionOutside = (event: MouseEvent | TouchEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleInteractionOutside);
    document.addEventListener('touchstart', handleInteractionOutside);

    return () => {
      document.removeEventListener('mousedown', handleInteractionOutside);
      document.removeEventListener('touchstart', handleInteractionOutside);
    };
  }, [ref, callback]);
};

export default useOutsideInteraction;
