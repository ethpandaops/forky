import classNames from 'classnames';

import Logo from '@assets/forky_logo.png';

export default function Loading({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={classNames('w-full h-full flex flex-col items-center justify-center', className)}
    >
      <img src={Logo} className="object-contain w-72 h-72" />
      <h1 className="mt-6 text-2xl text-white">{message}</h1>
    </div>
  );
}
