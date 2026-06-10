import classNames from 'clsx';

import Logo from '@assets/forky_logo.png';

export default function Loading({
  message,
  className,
  textColor,
}: {
  message: string;
  className?: string;
  textColor?: string;
}) {
  return (
    <div
      className={classNames(
        'w-full h-full flex flex-col items-center justify-center',
        textColor ?? 'text-foreground',
        className,
      )}
    >
      <img src={Logo} className="size-72 object-contain" />
      <h1 className="mt-6 font-mono text-base uppercase tracking-widest">{message}</h1>
    </div>
  );
}
