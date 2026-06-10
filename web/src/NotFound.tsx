import Logo from '@assets/forky_logo.png';

export default function NotFound() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-shell">
      <img src={Logo} className="object-contain w-72 h-72" />
      <h1 className="mt-6 text-2xl text-danger-accent">Page not found</h1>
    </div>
  );
}
