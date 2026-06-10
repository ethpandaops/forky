import Logo from '@assets/forky_logo.png';

export default function NotFound() {
  return (
    <div className="flex h-dvh w-screen flex-col items-center justify-center bg-shell">
      <img src={Logo} className="size-72 object-contain" />
      <p className="mt-8 font-mono text-xs uppercase tracking-widest text-on-shell/60">404</p>
      <h1 className="mt-2 font-mono text-base uppercase tracking-widest text-danger-accent">
        Page not found
      </h1>
    </div>
  );
}
