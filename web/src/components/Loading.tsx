import classNames from 'classnames';

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
        textColor ?? 'text-stone-900 dark:text-stone-100',
        className,
      )}
    >
      <img src={Logo} className="object-contain w-72 h-72" />
      <h1 className="mt-6 text-2xl">{message}</h1>
    </div>
  );
}
