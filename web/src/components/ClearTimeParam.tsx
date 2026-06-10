import { useEffect } from 'react';

import { useAppNavigate, usePathname } from '@hooks/useAppNavigation';

/**
 * Strips the one-shot `?t` time param from the URL once the app has mounted and
 * locked in its initial time. Rendered inside the loaded app tree so the time
 * read in App survives before this clears it.
 */
export default function ClearTimeParam() {
  const pathname = usePathname();
  const navigate = useAppNavigate();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('t')) {
      navigate(pathname, { replace: true });
    }
  }, [pathname, navigate]);

  return null;
}
